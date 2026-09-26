/**
 * Site-wide film grain + vignette (Phase 1), so the 2D "paper" sections
 * share the 3D stage's filmed look. Pure CSS over a tiny SVG turbulence
 * tile - no canvas, no JS - stepped (not smoothly animated) like real
 * grain, and removed entirely for reduced motion and in print.
 */
export function FilmGrain() {
  return (
    <div aria-hidden className="film-grain">
      <div className="film-grain-noise" />
      <div className="film-vignette" />
    </div>
  );
}
