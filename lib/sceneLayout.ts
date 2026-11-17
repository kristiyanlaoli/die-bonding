import type { Parameters } from './simulation';

/**
 * Keeps the pick-up wafer frame and target substrate spatially separated for
 * every die size supported by the UI. All distances are illustrative 3D units.
 * This must be shared by geometry and camera framing.
 */
export function getSceneLayout(p: Pick<Parameters, 'dieWidth' | 'dieHeight'>) {
  const largestDieSide = Math.max(p.dieWidth, p.dieHeight);
  const tapeRadius = Math.max(4.4, largestDieSide * 1.53);
  const tapeOuterRadius = tapeRadius + 0.36; // torus and backing clearance
  const substrateWidth = Math.max(8.5, p.dieWidth + 3.6);
  const substrateDepth = Math.max(7.7, p.dieHeight + 3.6);
  const substrateX = 2.2;
  const gap = Math.max(2.4, largestDieSide * 0.34);
  const waferX = substrateX - (substrateWidth / 2 + tapeOuterRadius + gap);
  const leftEdge = waferX - tapeOuterRadius;
  const rightEdge = substrateX + substrateWidth / 2;

  return {
    tapeRadius,
    tapeOuterRadius,
    substrateWidth,
    substrateDepth,
    substrateX,
    waferX,
    gap,
    leftEdge,
    rightEdge,
    centerX: (leftEdge + rightEdge) / 2,
    fullWidth: rightEdge - leftEdge,
    fullDepth: Math.max(2 * tapeOuterRadius, substrateDepth),
  };
}
