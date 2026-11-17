# Engineering notes: simplified paste-type die attach model

## Process representation

The model follows the training-presentation process for conventional paste-type die bonding: dispense adhesive onto the substrate; select and pick a good die with ejector pins and a vacuum collet; align the die face up; place it on adhesive; cure the adhesive; inspect results.

This simulator is **not** a calibrated virtual replica of a specific die bonder. All values are deliberately adjustable to show *qualitative* cause and effect.

## Units and model

Variables:

- Die width `W` and height `H` in mm
- Dispense volume `V` in nL (1 nL = 0.001 mm³)
- Target BLT `T` in µm
- Nominal die attach area `A = W × H` in mm²
- Perimeter `P = 2(W+H)` in mm
- `Vtarget = A × T` in nL because 1 mm² × 1 µm = 1 nL

1. A heuristic *coverage percentage* combines `V/Vtarget`, pattern bonus, force, viscosity, and intentional imbalance. Its output is bounded to 35–99.7%; it is not a physical surface wetting calculation.
2. `filmFraction` uses 0.91 minus a modest function of excess volume, bounded 0.67–0.97. This is a chosen educational partitioning parameter.
3. Estimated `BLT` (µm) = `V × filmFraction / (A × coverageFraction)`, bounded 4–100 µm.
4. Estimated `filmVolume` (nL) = `min(V, A × coverageFraction × BLT)`.
5. Remaining volume is assigned to a visible perimeter fillet. Estimated fillet width (µm) = `excessVolume / (P × 0.020)`, capped at 900 µm. The 0.020 mm denominator is a chosen cross-sectional fillet geometry approximation, not measured calibration.
6. Placement offset (µm) = `sqrt(offsetX² + offsetY²)`.
7. Die tilt and apparent void area are estimated with intentionally simple independent heuristics involving volume-induced coverage, viscosity, force, and imbalance. Neither is based on actual acoustic microscopy or cross-section data.
8. Thermal cure completion is an approximate fraction based on chosen temperature and duration relative to the nominal preset. It does not use Arrhenius kinetics, thermal diffusivity, or a material cure datasheet.
9. PASS/WARNING/FAIL thresholds are strictly illustrative and not production specifications.

## Graphics conventions

- Position and lateral dimensions are intended to be visually comparable, not accurately calibrated to an actual machine envelope.
- The adhesive's visible height and the die tilt are *exaggerated* deliberately to make the mechanism observable.
- The 3D adhesive is procedural geometry, **not** a finite-volume fluid simulation or CFD.
- The UV mode is a hypothetical adhesive specifically compatible with illumination at accessible exposed edges; it never assumes UV can propagate through opaque silicon.
- The application uses an accelerated educational sequence; playback seconds are not actual production cycle times.

## Source context

The user-supplied *Die Bonding and Bonding Equipment* PowerPoint emphasizes epoxy paste dispensing, die pick-up and placement, thermal/UV curing depending on adhesive chemistry, and inspection concerns: BLT, placement, die tilt, voids, coverage, delamination, fillet and bleed. This simulator focuses on those concepts without adding flip-chip or solder joints.
