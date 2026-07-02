import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initTheme } from './js/theme.js';
import { initReveals } from './js/reveal.js';
import { initTrace } from './js/trace.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initTheme();
initReveals(reduced);

// Build the trace after fonts settle so anchor positions are final.
let traceStarted = false;
const startTrace = () => {
  if (traceStarted) return;
  traceStarted = true;
  initTrace(reduced);
};
document.fonts.ready.then(startTrace);
// Fallback in case fonts.ready never resolves (very old browsers).
setTimeout(startTrace, 3000);

// Lazy-load the 3D viewer only when the featured section approaches —
// Three.js stays out of the initial payload entirely.
const stage = document.getElementById('viewer-stage');
if (stage) {
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    import('./js/viewer.js').then((m) =>
      m.initViewer({
        stage,
        canvas: document.getElementById('viewer-canvas'),
        fallback: document.getElementById('viewer-fallback'),
        reduced,
      })
    ).catch((err) => {
      console.warn('[viewer] failed to start:', err);
      document.getElementById('viewer-canvas').hidden = true;
      document.getElementById('viewer-fallback').hidden = false;
      stage.style.height = '70svh';
    });
  };
  new IntersectionObserver(
    (entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) {
        obs.disconnect();
        start();
      }
    },
    { rootMargin: '150% 0%' }
  ).observe(stage);
}
