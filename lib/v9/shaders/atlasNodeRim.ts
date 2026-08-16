/**
 * Atlas node rim-light shader (docs/PORTFOLIO_V9_ARCHITECTURE.md polyglot
 * addendum, Phase 10). Replaces AtlasNode's `meshLambertMaterial` with a
 * small, reviewed `THREE.ShaderMaterial` doing a fresnel rim-light term -
 * view-angle-dependent glow around each node's silhouette. This is
 * something MeshLambertMaterial genuinely cannot do: Lambert shading is
 * purely N·L diffuse, with no view-direction term at all, so it cannot
 * produce a glow that brightens toward a mesh's silhouette edge the way
 * this fresnel term does - the actual justification the addendum
 * requires ("where standard Three.js materials cannot achieve the
 * selected art direction").
 *
 * Decorative and nonessential: the base color and emissive pulse (the
 * information this material conveys - "is this node selected") are
 * unchanged from the previous meshLambertMaterial; only the rim term is
 * new. Reverting to AtlasNode's original meshLambertMaterial removes
 * only this glow, nothing else.
 */
export const atlasNodeRimVertexShader = `
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const atlasNodeRimFragmentShader = `
uniform vec3 uColor;
uniform vec3 uEmissiveColor;
uniform float uEmissiveIntensity;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);

  // Fresnel term: 0 facing the camera straight-on, rising toward 1 at
  // grazing angles near the silhouette edge.
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

  vec3 rim = uEmissiveColor * fresnel * uEmissiveIntensity;
  gl_FragColor = vec4(uColor + rim, 1.0);
}
`;

export interface AtlasNodeRimUniforms {
  uColor: { value: [number, number, number] };
  uEmissiveColor: { value: [number, number, number] };
  uEmissiveIntensity: { value: number };
}
