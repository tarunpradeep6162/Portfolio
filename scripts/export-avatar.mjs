#!/usr/bin/env node
/**
 * Exports Tarun's armoured avatar (lib/avatar/buildAvatar.ts) to:
 *   public/avatar/tarun-armour.glb     - glTF binary with the "Idle" clip
 *   public/avatar/renders/{front,three-quarter,side,back}.png
 *
 * Runs the real three.js builder + GLTFExporter inside headless Chromium
 * (the exporter needs browser APIs), serving the repo over a tiny local
 * HTTP server with an import map for three.
 *
 *   node scripts/export-avatar.mjs
 *   CHROMIUM_PATH=/path/to/chrome node scripts/export-avatar.mjs
 */
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import ts from "typescript";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const OUT = join(ROOT, "public/avatar");
const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".webp": "image/webp", ".html": "text/html" };

const builderTs = await readFile(join(ROOT, "lib/avatar/buildAvatar.ts"), "utf8");
const builderJs = ts.transpileModule(builderTs, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

const page = `<!doctype html><html><body style="margin:0">
<script type="importmap">{"imports":{
  "three":"/node_modules/three/build/three.module.js",
  "three/examples/jsm/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildAvatar } from "/__builder.js";

const faceTexture = await new THREE.TextureLoader().loadAsync("/public/rc01/face-holo.webp");
faceTexture.colorSpace = THREE.SRGBColorSpace;
faceTexture.flipY = true;
const avatar = buildAvatar({ faceTexture });

// ---- GLB
const glb = await new GLTFExporter().parseAsync(avatar.root, { binary: true, animations: avatar.clips });
const bytes = new Uint8Array(glb);
let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
window.__glb = btoa(bin);

// ---- Character-sheet renders
const W = 700, H = 1050;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#0b0f14");
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const key = new THREE.DirectionalLight("#ffffff", 2.2); key.position.set(2, 4, 3); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -1; key.shadow.camera.right = 1; key.shadow.camera.top = 2; key.shadow.camera.bottom = -0.2;
scene.add(key, new THREE.DirectionalLight("#748cff", 1.6).translateX(-3).translateY(2).translateZ(-2), new THREE.DirectionalLight("#d8ff4f", 0.9).translateX(3).translateZ(-2));
scene.add(new THREE.AmbientLight("#ffffff", 0.25));
const floor = new THREE.Mesh(new THREE.CircleGeometry(0.9, 64), new THREE.ShadowMaterial({ opacity: 0.45 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.5, 64), new THREE.MeshBasicMaterial({ color: "#d8ff4f", transparent: true, opacity: 0.06 }));
glowDisc.rotation.x = -Math.PI / 2; glowDisc.position.y = 0.002; scene.add(glowDisc);
scene.add(avatar.root);
const camera = new THREE.PerspectiveCamera(24, W / H, 0.1, 50);
const views = { front: 0, "three-quarter": -Math.PI / 4.5, side: -Math.PI / 2, back: Math.PI };
window.__renders = {};
for (const [name, angle] of Object.entries(views)) {
  avatar.root.rotation.y = angle;
  camera.position.set(0, 1.0, 5.0); camera.lookAt(0, 0.93, 0);
  renderer.render(scene, camera);
  window.__renders[name] = renderer.domElement.toDataURL("image/png");
}
window.__done = true;
</script></body></html>`;

const server = createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (url === "/") return res.end(page);
  if (url === "/__builder.js") {
    res.setHeader("content-type", "text/javascript");
    return res.end(builderJs);
  }
  const file = normalize(join(ROOT, url));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.setHeader("content-type", TYPES[extname(file)] ?? "application/octet-stream");
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const { port } = server.address();

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const tab = await browser.newPage();
tab.on("pageerror", (e) => console.error("page error:", e.message));
await tab.goto(`http://localhost:${port}/`);
await tab.waitForFunction(() => window.__done === true, null, { timeout: 180_000 });
const { glb, renders } = await tab.evaluate(() => ({ glb: window.__glb, renders: window.__renders }));

await mkdir(join(OUT, "renders"), { recursive: true });
await writeFile(join(OUT, "tarun-armour.glb"), Buffer.from(glb, "base64"));
for (const [name, dataUrl] of Object.entries(renders)) {
  await writeFile(join(OUT, "renders", `${name}.png`), Buffer.from(dataUrl.split(",")[1], "base64"));
}
console.log(`wrote public/avatar/tarun-armour.glb (${Math.round(Buffer.from(glb, "base64").length / 1024)} KB) + ${Object.keys(renders).length} renders`);
await browser.close();
server.close();
