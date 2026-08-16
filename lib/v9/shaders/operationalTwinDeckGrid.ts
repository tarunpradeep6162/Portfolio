/**
 * Operational Twin ground-plane grid shader
 * (docs/PORTFOLIO_V9_ARCHITECTURE.md polyglot addendum, Phase 10).
 * Replaces the Instrument Deck's flat `meshLambertMaterial color="#0d1218"`
 * ground plane with a small, reviewed `THREE.ShaderMaterial` that
 * procedurally renders grid lines from the plane's own UV coordinates -
 * something a flat color material cannot do without an external texture
 * asset, which this codebase deliberately avoids everywhere else in
 * these 3D systems (V6/V7's "no external 3D assets" convention).
 *
 * Static - no per-frame uniform updates, since the ground plane itself
 * was never animated before this shader either. Decorative and
 * nonessential: reverting to the original flat `meshLambertMaterial`
 * removes only the grid-line texture, not any information the deck
 * conveys (instrument heights/colors/selection are unchanged, driven
 * entirely by InstrumentDeckInstances/StatusPips, neither of which this
 * shader touches).
 */
export const operationalTwinDeckGridVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const operationalTwinDeckGridFragmentShader = `
uniform vec3 uBaseColor;
uniform vec3 uLineColor;
uniform float uGridSize;
uniform float uLineWidth;

varying vec2 vUv;

void main() {
  vec2 scaled = vUv * uGridSize;
  vec2 gridDist = abs(fract(scaled - 0.5) - 0.5) / fwidth(scaled);
  float line = min(gridDist.x, gridDist.y);
  float mask = 1.0 - smoothstep(0.0, uLineWidth, line);

  vec3 color = mix(uBaseColor, uLineColor, mask * 0.35);
  gl_FragColor = vec4(color, 1.0);
}
`;
