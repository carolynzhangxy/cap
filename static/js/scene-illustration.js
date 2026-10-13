import {configuration, simulate} from './scene-controller.js?v=6';

// First-scene settings only; archived comparisons retain their own parameters.
// Scaling k and omega by the same factor scales the continuous vector field
// uniformly. The potential, hysteresis, amplitude, and initial phase stay fixed.
export function illustrationSettings(layout) {
  if (layout.model !== 'holonomic') return {};
  const reference = configuration(layout);
  const omega = 60;
  const scale = omega / reference.omega;
  return {omega, k: reference.k * scale, horizon: reference.horizon / scale};
}

export function simulateIllustration(layout) {
  return simulate(layout, illustrationSettings(layout));
}
