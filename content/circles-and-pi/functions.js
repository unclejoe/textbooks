// =============================================================================
// Circles and Pi
// (c) Mathigon
// =============================================================================



import { Point, toWord } from '@mathigon/fermat';
import { $N } from '@mathigon/boost';

import '../shared/components/conic-section';
import './components/pi-scroll';

// -----------------------------------------------------------------------------

export function digits($step) {
  const $scroller = $step.$('x-pi-scroll');
  const $input = $step.$('.pi-controls input');
  const $warning = $step.$('.pi-warning');

  fetch('/resources/circles-and-pi/images/pi-100k.txt')
      .then(response => response.text())
      .then(data => $scroller.setUp(data + '…'))
      .then(() => fetch('/resources/circles-and-pi/images/pi-1m.txt'))
      .then(response => response.text())
      .then(data => $scroller.setUp(data + '…'));

  $input.change((str) => {
    const index = $scroller.findString(str);
    $warning.css('visibility', index < 0 ? 'visible' : 'hidden');
  });
}

// -----------------------------------------------------------------------------

function deg(rad) { return rad / Math.PI * 180; }

function circleSector(cx, cy, r, fromAngle, toAngle) {
  const from = Point.fromPolar(toAngle - Math.PI/2, r).shift(cx, cy);
  const to = Point.fromPolar(fromAngle - Math.PI/2, r).shift(cx, cy);
  const flag = (toAngle - fromAngle <= Math.PI) ? 0 : 1;

  const o1 = Point.fromPolar(toAngle + Math.PI/2, r).shift(cx, cy);
  const o2 = Point.fromPolar((toAngle + fromAngle) / 2 + Math.PI/2, r).shift(cx, cy);
  const o3 = Point.fromPolar(fromAngle + Math.PI/2, r).shift(cx, cy);

  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${flag} 0 ${to.x} ${to.y} L ${cx} ${cy} Z M ${o1.x} ${o1.y} M ${o2.x} ${o2.y} M ${o3.x} ${o3.y}`;
}

function ring(cx, cy, r1, r2, fromAngle, toAngle) {
  if (fromAngle > toAngle) [fromAngle, toAngle] = [toAngle, fromAngle];
  fromAngle -= Math.PI/2;
  toAngle -= Math.PI/2;

  const A = Point.fromPolar(toAngle);
  const B = Point.fromPolar(fromAngle);
  const flag = (toAngle - fromAngle <= Math.PI) ? 0 : 1;

  return `M ${A.x * r1 + cx} ${A.y * r1 + cy}` +
         `A ${r1} ${r1} 0 ${flag} 0 ${B.x * r1 + cx} ${B.y * r1 + cy}` +
         `L ${B.x * r2 + cx} ${B.y * r2 + cy}` +
         `A ${r2} ${r2} 0 ${flag} 1 ${A.x * r2 + cx} ${A.y * r2 + cy} Z`;
}

export function area($step) {
  const $svgs = $step.$$('.circle-area');
  const $sliders = $step.$$('x-slider');
  $step.model.set('toWord', toWord);
  const r = 60;

  let angle, dx, dy;
  const rect = $N('g', {}, $svgs[0]);
  const circle1 = $N('g', {}, $svgs[0]);

  function applyTransforms1() {
    const wedges = circle1.children;
    const p = $sliders[0].current / $sliders[0].steps;

    for (let i = 0; i < $step.model.n1; ++i) {
      const a = deg(-i * angle) + ((i % 2) ? 180 : 0);
      const x = dx * i - ($step.model.n1 - 1) * dx / 2;
      const y = i % 2 ? 90 : 90 + dy;
      wedges[i].setAttr('transform', `translate(${p*x},${p*y}) rotate(${p*a})`);
    }
  }

  $step.model.watch((state) => {
    // TODO Reuse elements for better performance.
    circle1.removeChildren();
    rect.removeChildren();

    angle = 2 * Math.PI / state.n1;
    dx = r * Math.sqrt(2 - 2 * Math.cos(angle)) / 2;
    dy = r * Math.cos(angle / 2);

    for (let i = 0; i < state.n1; ++i) {
      const d = circleSector(170, 65, r, (i-0.5) * angle, (i+0.5) * angle);
      $N('path', {d}, rect);
      $N('path', {d}, circle1);
    }

    applyTransforms1();
  });

  $sliders[0].on('move', applyTransforms1);

  // ---------------------

  const circle2 = $N('g', {}, $svgs[1]);
  const triangle = $N('g', {}, $svgs[1]);

  function drawRings(element, p) {
    const $rings = element.children;

    const rmin = Math.pow(20 + p * 100, 1 + p) - 20;
    const dr = r / $step.model.n2;

    const cx = 180 + p * (10 - 175);
    const cy = 65 + p * (150 - 65) - rmin;

    for (let i = 0; i < $step.model.n2; ++i) {
      const angle = Math.PI - 1.999 * Math.PI * ((i + 0.5) * dr) / (rmin + (i + 0.5) * dr);
      const d = ring(cx, cy, rmin + i * dr, rmin + (i + 1) * dr, Math.PI, angle);
      $rings[i].setAttr('d', d);
    }
  }

  $step.model.watch((state) => {
    // TODO Reuse elements for better performance.
    triangle.removeChildren();
    circle2.removeChildren();

    for (let i = 0; i < state.n2; ++i) {
      $N('path', {}, triangle);
      $N('path', {}, circle2);
    }

    drawRings(circle2, 0);
    drawRings(triangle, $sliders[1].current / $sliders[1].steps);
  });

  $sliders[1].on('move', (x) => drawRings(triangle, x / $sliders[1].steps));
}

// -----------------------------------------------------------------------------

export function conics($step) {
  const $conics = $step.$('x-conic-section');
  const $labels = $step.$('.conics').children;
  let $activeLabel = $labels[0];

  $conics.on('rotate', (a) => {
    const active = (a < 0.05) ? 0 : (a < 1.1) ? 1 : (a < 1.15) ? 2 : 3;
    if ($activeLabel === $labels[active]) return;
    $activeLabel.removeClass('active');
    $activeLabel = $labels[active];
    $activeLabel.removeClass('hide');
    $activeLabel.addClass('active');
    $step.score(['circle', 'ellipse', 'parabola', 'hyperbola'][active]);
  });
}
