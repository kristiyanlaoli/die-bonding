# Die Bonding Lab — Paste-Type Epoxy Simulator

A fully client-side, interactive 3D **educational model** of conventional face-up die attach using paste adhesive. Built with Next.js, React, Three.js / React Three Fiber, Drei, TypeScript, and CSS/Tailwind; suitable for Vercel.

## Features

- Procedural, rotatable 3D assembly viewport with wafer tape, pick-up collet, substrate, epoxy dispenser, semiconductor die and curing enclosure
- Six stages: **Dispense → Pick → Align → Place → Cure → Inspect**
- Start, pause, resume, restart, previous/next stage, timeline scrubbing and 0.5–4× speed
- Epoxy dispensing patterns: single dot, five-dot, X pattern
- Approximate epoxy spreading, squeeze-out, fillet formation and cross-section view
- Controls for die dimensions, substrate, viscosity, adhesive volume, nozzle gap, deposit imbalance, alignment offset, bond force, BLT target and curing parameters
- Six preset scenarios: nominal, insufficient paste, excess paste, misalignment, tilt, potential voids
- Derived BLT, adhesive coverage, fillet, placement error, tilt, and hypothetical void/delamination indicators
- On-screen PASS/FAIL inspection verdict with every failed criterion explained; no CSV export
- Responsive layout and no external 3D models, databases or paid APIs

## Run locally

Requires Node.js **20.9+** (Node 22 recommended).

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

For a production build:

```bash
npm run build
npm start
```

## Deploy on Vercel

1. Unzip the project. Create a GitHub repository and commit these source files.
2. In [Vercel](https://vercel.com/new), select **Add New → Project → Import Git Repository**.
3. Vercel should recognize **Next.js** automatically. Leave framework and build settings at their defaults.
4. Click **Deploy**. No environment variables or database connections are necessary.
5. Open your Vercel-provided URL to use the interactive simulator.

You can also deploy with `npx vercel` after signing in to the Vercel CLI.

## Scientific scope / important limitations

This is a **teaching visualization**, not a process-qualification tool. Adhesive spreading is represented by procedural geometry and a simplified volume-partition model. No Navier–Stokes solver, fluid/viscoelastic rheology, validated material kinetics, actual equipment controller, measured void metrology, or finite-element stress simulation is included.

- The die active surface remains **face up** throughout conventional epoxy bonding; this is not flip-chip solder paste.
- For a die with area A in mm² and paste volume V in nL, an equivalent unspread film thickness is V/A µm. The model splits deposited volume between an estimated adhesive film and fillet for an internally consistent educational approximation. The visual thickness is intentionally exaggerated so the adhesive can be seen.
- Coverage, voids, tilt, bleed and delamination risks use transparent, *unvalidated heuristic formulas* in `lib/simulation.ts`.
- PASS/FAIL thresholds are demonstration defaults and **not** industry acceptance criteria; they must not be used to make real manufacturing decisions.
- The thermal cure profiles are approximate educational presets, not qualified adhesive manufacturer's recipes. The alternative UV example is explicitly limited to a UV-compatible, edge-accessible adhesive; UV is **not** portrayed as curing through opaque silicon.
- The animation runs on an accelerated illustrative time base, unrelated to physical machine cycle-time calibration.

The topic sequence and manufacturing context are adapted from the supplied *Die Bonding and Bonding Equipment* training presentation: conventional paste die attach and its key inspection parameters.

## Project structure

```
app/
  page.tsx                 Next.js page (client-side simulator)
  layout.tsx               App HTML and metadata
  globals.css              Industrial dashboard UI
components/
  Simulator.tsx            UI, control system, timeline and inspection findings
  SimulationScene.tsx      Procedural 3D wafer/collet/nozzle/die/paste and curing
lib/
  simulation.ts            Stage definitions, presets, dimensioned heuristic model
```

## Known tradeoffs

This project fetches normal npm dependencies during installation/deployment, but has no runtime dependency on remote asset servers. Interactive WebGL requires a browser with hardware acceleration. Because viewport geometry and adhesive models are procedural, the initial 3D view may take a few seconds to initialize on slow mobile devices.

## Changes in v1.1

- Wafer frame, leadframe/laminate, pickup trajectory, and camera auto-layout now react to die width AND length, maintaining a physical clearance between the wafer ring and substrate even at maximum die sizes.
- Removed CSV exports. Final inspection displays either **PASS** or **FAIL**, with a full list of failed checks and measured/estimated values against illustrative thresholds.
- The verdict panel updates as inputs change and appears within the viewport on the inspection stage.
