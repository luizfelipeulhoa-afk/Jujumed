// Estimated beat grid from the uploaded 2:28–3:13 music excerpt.
// One side-to-side cycle spans two beats, using the audio clock so pause/resume stays aligned.
const BEAT_SECONDS = 0.5921088435;
const FIRST_BEAT = 0.394739229;

export function danceMotion(time: number, reduced = false) {
  const phase = ((time - FIRST_BEAT) / BEAT_SECONDS) * Math.PI;
  return {
    sway: reduced ? 0 : Math.sin(phase),
    bounce: reduced ? 0 : (1 + Math.cos(phase * 2)) / 2,
  };
}
