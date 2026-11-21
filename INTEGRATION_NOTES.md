# Integration notes

The four historical simulators used mostly identical global styles, layout structure and component names, but different process stages, simulation parameter types and materials.

To prevent import collisions, the combined site vendors each original process into `simulators/<kind>/`. All internal source imports are rewritten to their own process directory; 3D mesh code and quality calculations are not interchanged. Each original `Simulator` takes an optional `initialLanguage` prop and is wrapped in a `sim-frame` with a common `SuiteBar`.

`app/globals.css` reuses the v1.6 Paste Type stylesheet as the underlying theme. Small original additions for Film Type, Mass Reflow and TCB (stage count, timeline, legend) are applied by matching `[data-kind]`. This avoids conflicting global mobile breakpoints that otherwise appear when concatenating four legacy stylesheets. Mobile presets are hidden with a `max-width:999px` rule, as requested in the earlier standalone simulators.

The wide-area flux coating of Mass Reflow v1.2 and the continuous droplet-to-spreading NCP interpolation in TCB v1.2 are preserved from their original ZIPs.
