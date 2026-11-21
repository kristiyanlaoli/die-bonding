# Die Bonding Lab — Unified 3D Simulation Suite

A single **Next.js 15 + React 19 + Three.js** website containing four interactive semiconductor die-bonding educational simulators, with a bilingual/multilingual start page, individual simulation workspaces, and shared navigation.

## What is included

| Route | Technology | Integrated source version | Key process features |
| --- | --- | --- | --- |
| `/simulators/paste` | Paste Adhesive (conventional die attach) | v1.6 | Epoxy dispense, die pickup, alignment, placement/spreading, curing, visual inspection |
| `/simulators/film` | Die Attach Film (DAF) | v1.1 | Wafer thinning, film lamination, dicing, adhesive-backed die pickup and attachment, curing |
| `/simulators/reflow` | Flip Chip Mass Reflow | v1.2 | **Wide-area flux spray**, flip, alignment, placement, mass reflow, flux cleaning, capillary underfill, curing |
| `/simulators/tcb` | Flip Chip Thermo-Compression Bonding (TCB) | v1.2 | NCP dispense, flip, alignment, **continuous NCP spreading on contact**, local heat/force/dwell, cure |

The landing page is located at `/` and has a card for each process. All five pages support English (default), Bahasa Indonesia and Traditional Chinese (Taiwan). Use SVG flag controls to change languages. Language selection is passed by the `?lang=en|id|zhTW` URL parameter when navigating across pages.

All original parameter, animation, camera, timeline, and PASS/FAIL calculations remain in **separate per-process modules**, with no shared formulas accidentally replacing other simulators' logic.

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

For production:

```bash
npm run typecheck
npm run build
npm run start
```

## Deploy to Vercel

1. Create a GitHub repository using **the contents of this ZIP as the repository root**.
2. Import that repository into Vercel as one Next.js project.
3. Use the standard build command `npm run build` and framework preset **Next.js**.
4. Deploy. The home page and the four `/simulators/...` routes are served by the **same Vercel project**.

Do **not** deploy the four legacy ZIP projects separately when using this combined version.

## Navigation and mobile behavior

- Desktop: a thin simulation navigation bar above each workstation provides direct links to all four simulations.
- Mobile: switch simulators from a compact dropdown; left panel stage navigation and 3D viewport remain usable.
- The original **Process Scenarios** section remains **hidden at viewport widths up to 999 px**, consistent with the latest single-process projects.
- Each process has its own independent local state; changing process navigates to another route and starts its simulation from its own default settings. This is intentional.

## Structure

```
app/
  page.tsx                  # 3-language landing selector
  simulators/{paste,film,reflow,tcb}/page.tsx
  globals.css               # original dark theme plus landing/nav styles
components/
  Landing.tsx               # home page
  ProcessVisual.tsx         # compact educational vector process illustrations
  SuiteBar.tsx              # navigation among simulators
simulators/
  paste/{components,lib}/   # original paste process
  film/{components,lib}/    # original DAF process
  reflow/{components,lib}/  # original mass reflow process
  tcb/{components,lib}/     # original TCB process
```

## Important engineering limitation

All simulations and PASS/FAIL metrics are **educational, qualitative/heuristic representations**, not calibrated predictive models or qualified manufacturing recipes. Do not use displayed thresholds to set production process parameters. Validate recipes against equipment and material supplier guidance.

## Build verification

The merged project was statically inspected, with TypeScript/TSX parsing and import references checked. A complete `npm install`, production Next.js build, and browser-based WebGL testing were not possible in the available offline environment. The combined source is provided for normal Next.js/Vercel installation and testing.
