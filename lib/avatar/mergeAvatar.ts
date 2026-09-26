import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Joints that are actually animated (idle clip, RC-01 puppeting, stage). */
const ANIMATED = new Set([
  "TarunArmour",
  "hips", "spine", "chest", "neck", "head",
  "shoulderL", "shoulderR", "upperArmL", "upperArmR", "elbowL", "elbowR",
  "forearmL", "forearmR", "handL", "handR",
  "hipL", "hipR", "thighL", "thighR", "kneeL", "kneeR", "shinL", "shinR", "footL", "footR",
]);

/**
 * Collapses the avatar's many small static meshes into one mesh per
 * (animated joint, material) pair: everything that never moves relative to
 * a joint - plates, strips, fingers, the torso/helmet shape groups - is
 * baked into that joint's space and drawn in a single call. Named meshes
 * (the visor, the hologram face - looked up by code) stay separate, so all
 * animation and per-part effects keep working. ~140 draws -> ~40.
 */
export function mergeAvatarMeshes(root: THREE.Object3D): () => void {
  root.updateMatrixWorld(true);
  const created: THREE.BufferGeometry[] = [];
  const joints: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (ANIMATED.has(o.name)) joints.push(o);
  });

  for (const joint of joints) {
    const inverse = joint.matrixWorld.clone().invert();
    const byMaterial = new Map<THREE.Material, THREE.Mesh[]>();
    const visit = (node: THREE.Object3D) => {
      for (const child of node.children) {
        if (ANIMATED.has(child.name)) continue; // another joint's territory
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && !mesh.name && !Array.isArray(mesh.material)) {
          const list = byMaterial.get(mesh.material) ?? [];
          list.push(mesh);
          byMaterial.set(mesh.material, list);
        }
        visit(child);
      }
    };
    visit(joint);

    for (const [material, meshes] of byMaterial) {
      if (meshes.length < 2) continue;
      const geometries = meshes.map((m) => {
        const relative = inverse.clone().multiply(m.matrixWorld);
        let g = m.geometry.clone().applyMatrix4(relative);
        if (g.index) g = g.toNonIndexed();
        for (const name of Object.keys(g.attributes)) {
          if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
        }
        return g;
      });
      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      created.push(merged);
      meshes.forEach((m) => m.parent?.remove(m));
      joint.add(new THREE.Mesh(merged, material));
    }
  }
  return () => created.forEach((g) => g.dispose());
}
