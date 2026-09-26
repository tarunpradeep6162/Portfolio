import * as THREE from "three";

/**
 * Phase 15 - a slot for a sculpted likeness. The procedural armour shows
 * Tarun's face as a visor hologram; a real 3D head (e.g. generated from a
 * portrait with an image-to-3D tool, or modelled in Blender) can replace
 * it without touching code:
 *
 *   1. Export the head as .glb, facing +Z, origin at the base of the neck,
 *      about 0.25 units tall (it is auto-fitted either way).
 *   2. Put it in public/avatar/ (e.g. public/avatar/head.glb).
 *   3. Set NEXT_PUBLIC_AVATAR_HEAD_URL=/avatar/head.glb and redeploy.
 *
 * The head attaches to the rig's "head" joint, so every gesture, nod and
 * gaze RC-01 already performs drives it; the helmet and visor hide.
 */
export const HEAD_MODEL_URL: string | null = process.env.NEXT_PUBLIC_AVATAR_HEAD_URL || null;

export async function attachHeadModel(avatarRoot: THREE.Object3D, url: string): Promise<() => void> {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const gltf = await new GLTFLoader().loadAsync(url);
  const headJoint = avatarRoot.getObjectByName("head");
  const helmet = avatarRoot.getObjectByName("helmetShape");
  if (!headJoint) throw new Error("avatar has no head joint");
  const model = gltf.scene;
  // Fit to ~0.26 units tall, base at the joint.
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = 0.26 / Math.max(size.y, 1e-4);
  model.scale.setScalar(scale);
  model.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale - 0.1, -((box.min.z + box.max.z) / 2) * scale);
  model.name = "sculptedHead";
  headJoint.add(model);
  if (helmet) helmet.visible = false;
  return () => {
    headJoint.remove(model);
    if (helmet) helmet.visible = true;
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      mats.forEach((m) => m.dispose());
    });
  };
}
