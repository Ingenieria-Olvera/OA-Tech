// The trace — a PCB-style routed line that physically threads every project
// together. Geometry is computed from the .trace-point anchors in the markup:
// vertical runs with 45° jogs where the rail position changes, exactly like
// Manhattan routing on a real board.
//
// Three strokes share the same geometry:
//   .trace-base  — the calm, always-visible quiet rule
//   .trace-flow  — the accent "current" that follows the reader down the page
//   .trace-fork  — a short 45° branch drawn once at the featured project
//
// Via markers (HTML, one per project) light up as the current passes them.

import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BEND_LEAD = 90;  // straight run left after a bend, before the anchor
const TAIL = 140;      // how far the trace continues past the last anchor

export function initTrace(reduced) {
  const svg = document.getElementById('trace-svg');
  const layer = svg.closest('.trace-layer');
  const anchors = [...document.querySelectorAll('.trace-point')];
  const vias = [...document.querySelectorAll('.via-marker')].map((el) => ({
    el,
    y: 0,
    lit: false,
  }));

  let flowPath = null;
  let totalLen = 0;
  let startY = 0;
  let endY = 0;
  let ticking = false;

  function docPos(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY };
  }

  function routePath(pts) {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dx = b.x - a.x;
      if (Math.abs(dx) < 1) {
        d += ` L ${b.x} ${b.y}`;
        continue;
      }
      const diag = Math.abs(dx);
      const room = b.y - a.y - 40 - BEND_LEAD; // vertical room for the jog
      if (room >= diag) {
        // Enough room: one clean 45° diagonal landing BEND_LEAD above b.
        const bendEnd = b.y - BEND_LEAD;
        d += ` L ${a.x} ${bendEnd - diag} L ${b.x} ${bendEnd} L ${b.x} ${b.y}`;
      } else {
        // Tight gap: route like a real board — vertical, 45° chamfer,
        // horizontal run, 45° chamfer, vertical. Never backtracks.
        const c = Math.max(4, Math.min(36, Math.floor((b.y - a.y) / 4)));
        const sign = Math.sign(dx);
        const yH = (a.y + b.y) / 2;
        d += ` L ${a.x} ${yH - c}`
          + ` L ${a.x + sign * c} ${yH}`
          + ` L ${b.x - sign * c} ${yH}`
          + ` L ${b.x} ${yH + c}`
          + ` L ${b.x} ${b.y}`;
      }
    }
    return d;
  }

  function pad(x, y, r) {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', y);
    c.setAttribute('r', r);
    c.setAttribute('fill', 'var(--accent)');
    return c;
  }

  function build() {
    const H = document.documentElement.scrollHeight;
    layer.style.height = `${H}px`;
    svg.setAttribute('width', document.documentElement.clientWidth);
    svg.setAttribute('height', H);
    svg.replaceChildren();

    // Sort by document position — the path must be monotonic in y no matter
    // where the anchor spans sit in the markup.
    const pts = anchors.map(docPos).sort((a, b) => a.y - b.y);
    startY = pts[0].y;
    const last = pts[pts.length - 1];
    endY = Math.min(last.y + TAIL, H - 40);
    const d = routePath(pts) + ` L ${last.x} ${endY}`;

    const base = document.createElementNS(SVG_NS, 'path');
    base.setAttribute('class', 'trace-base');
    base.setAttribute('d', d);
    svg.appendChild(base);

    flowPath = document.createElementNS(SVG_NS, 'path');
    flowPath.setAttribute('class', 'trace-flow');
    flowPath.setAttribute('d', d);
    svg.appendChild(flowPath);

    totalLen = flowPath.getTotalLength();
    flowPath.style.strokeDasharray = `${totalLen}`;
    flowPath.style.strokeDashoffset = `${totalLen}`;

    // Origin and terminal pads — the trace starts and ends at a drilled pad.
    svg.appendChild(pad(pts[0].x, pts[0].y, 5));
    svg.appendChild(pad(last.x, endY, 5));

    // The featured fork: a short 45° branch off the ClearNote via, drawn once
    // when that section arrives. The one deliberate rhythm break besides the
    // 3D moment itself.
    const featured = document.querySelector('#clearnote .trace-point');
    if (featured) {
      const p = docPos(featured);
      const fork = document.createElementNS(SVG_NS, 'path');
      fork.setAttribute('class', 'trace-fork');
      fork.setAttribute(
        'd',
        `M ${p.x} ${p.y} l 46 46 l 96 0`
      );
      svg.appendChild(fork);
      const len = fork.getTotalLength();
      fork.style.strokeDasharray = `${len}`;
      fork.style.strokeDashoffset = reduced ? '0' : `${len}`;
      if (!reduced) {
        ScrollTrigger.create({
          trigger: '#clearnote',
          start: 'top 65%',
          once: true,
          onEnter: () => { fork.style.strokeDashoffset = '0'; },
        });
      }
    }

    // Cache via y-positions for the pass-by check.
    vias.forEach((v) => { v.y = docPos(v.el).y + v.el.offsetHeight / 2; });

    if (reduced) {
      // No flowing current — the whole trace reads as already-made work.
      flowPath.style.strokeDashoffset = '0';
      vias.forEach((v) => v.el.classList.add('lit'));
    } else {
      update();
    }
  }

  // Map the reader's position to a length along the path. The path is
  // monotonic in y by construction, so a binary search on getPointAtLength
  // is exact enough.
  function lengthAtY(targetY) {
    if (targetY <= startY) return 0;
    if (targetY >= endY) return totalLen;
    let lo = 0;
    let hi = totalLen;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (flowPath.getPointAtLength(mid).y < targetY) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function update() {
    if (!flowPath) return;
    const tipY = window.scrollY + window.innerHeight * 0.62;
    const drawn = lengthAtY(tipY);
    flowPath.style.strokeDashoffset = `${Math.max(totalLen - drawn, 0)}`;

    vias.forEach((v) => {
      if (!v.lit && tipY >= v.y) {
        v.lit = true;
        v.el.classList.add('lit', 'pulse');
      } else if (v.lit && tipY < v.y - window.innerHeight * 0.5) {
        // Let a via go quiet again only when the reader has scrolled well
        // back above it, so it doesn't flicker at the threshold.
        v.lit = false;
        v.el.classList.remove('lit', 'pulse');
      }
    });
  }

  function onScroll() {
    if (ticking || reduced) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });

  // Pinned sections (the 3D stage) change document height when they attach,
  // so rebuild whenever ScrollTrigger re-measures the page.
  ScrollTrigger.addEventListener('refresh', build);

  window.addEventListener('scroll', onScroll, { passive: true });
  build();
}
