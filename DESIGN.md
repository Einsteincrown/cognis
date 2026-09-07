# Cognis Design Contract

## Design thesis

Cognis is an investment-decision instrument, not a generic productivity dashboard. It uses the supplied product prototype as its canonical interface: a compact institutional workspace that is operational enough to scan under pressure and explicit about uncertainty.

The visual language combines a dark institutional navigation rail with a crisp white and cool-gray application canvas. Binance-inspired gold identifies primary actions and active navigation; blue communicates progress, while green, amber, and red remain reserved for evidence and decision states.

## Product stakes

- Primary user: venture analyst preparing an evidence-backed committee decision.
- Primary task: identify the next consequential question and trace every claim to its source.
- Emotional target: rigorous, calm, consequential; never playful, futuristic, or “crypto neon.”
- Reading order: workspace/action, portfolio signal register, assessment queue, attention trail.

## Visual system

- Canvas: cool workspace `#f7f8fa`; surface `#ffffff`.
- Navigation: midnight `#071118`; raised midnight `#111e27`.
- Ink: `#111827`; secondary ink `#5f6978`; rules `#dce1e5`.
- Primary action: Binance-inspired gold `#f0c84b` with dark ink text; focus uses dark ochre `#8a5a00`. Risk and caution retain separate semantic roles.
- Verified: forest `#1f684d`. Informational: cobalt `#275d8c`.
- Display and UI: Inter. Data: IBM Plex Mono.
- Geometry: 6–10px radii for application controls and bounded work surfaces; circles remain reserved for people, steps, and status.
- Shadows are reserved for the outer prototype frame; internal grouping uses ground changes and rules.

## Composition

- Fixed 224px dark rail on desktop, compact icon rail at tablet, top masthead plus bottom navigation on phone.
- Main content is bounded at 1500px and follows a 12-column logic.
- Metrics form one continuous ruled register, not four cards.
- Queue is the dominant surface; supporting actions use a narrow editorial column.
- Assessment detail is a dossier: index, working paper, evidence margin.

## Interaction and responsive behavior

- Minimum touch target is 44px on small screens.
- Focus uses a 2px orange ring with 2px offset.
- Hover changes ground or rule color; static records never float.
- Motion is limited to 120–180ms state transitions and respects reduced motion.
- At 1180px evidence moves below the working paper; at 820px the rail compacts; at 640px navigation becomes a top masthead and registers reflow.

## Anti-slop constraints

- No gradients, glass blur, decorative glows, oversized pills, or generic icon circles.
- No card grid unless content represents genuinely independent selectable records.
- Status lozenges are reserved for operational states.
- New colors, radii, or typography require an update here.

## Implementation log

- 2026-09-06: Replaced the beige/lime generic dashboard skin with the dossier system while preserving HTML structure and application behavior.
- 2026-09-06: Added a lower-rail Cognis product signature with the square brand mark and a concise product description.
- 2026-09-06: Divided the rail body into the requested three explicit zones: Workspace, Configure, and the anchored Cognis product/social footer. Brand identity remains as the masthead above them.
- 2026-09-06: Removed the placeholder “Northstar Ventures” identity from the workspace selector and header breadcrumb.
- 2026-09-06: Grouped the queue canvas into three horizontal bands—workspace overview, decision signals, and working area—to continue the left rail’s three-part visual rhythm without moving the rail.
- 2026-09-06: Removed sticky and independently scrolling sidebar behavior so the rail and dashboard travel through one synchronized document scroll.
- 2026-09-06: Centered all three dashboard bands on a shared 1120px measure and compacted their typography, spacing, metrics, table rows, and activity rows to keep each group within its visual lane.
- 2026-09-06: Consolidated overview and signals as the first group, centered the complete assessment workspace as the second, and moved Cognis build information/socials into a third full-width black footer spanning the entire base.
- 2026-09-06: Stacked the footer signature so GitHub and X controls sit directly beneath the Cognis build description.
- 2026-09-06: Sloppi refinement pass raised small-text and primary-action contrast, restored four-way mobile navigation with a bottom action dock, expanded mobile touch targets, and transformed the assessment queue into stacked ruled records.
- 2026-09-06: Adapted the supplied Cognis prototype into the live frontend: compact pipeline search and filters, a three-step intake journey, and denser application framing, while preserving all existing venture, assessment, evidence, and Binance backend contracts.
- 2026-09-06: Replaced the analyst profile at the sidebar base with a Cognis build signature, concise product description, and placeholder X/GitHub controls ready for future URLs.
- 2026-09-06: Increased assessment and workspace typographic rhythm, line height, column separation, and component padding to improve scanability and alignment without losing the prototype's compact analyst-workstation density.
- 2026-09-07: Normalized spacing across queue, intake, assessment, evidence, and footer surfaces; strengthened the assessment's three-column dossier rhythm and replaced missing domain markers with explicit state indicators.
- 2026-09-07: Replaced abstract navigation glyphs with a consistent line-icon system, added task-specific navigation descriptions, and introduced a five-answer evidence and decision FAQ above the product footer.
- 2026-09-07: Added a compact product-orientation band above the Screening Queue, framing Cognis through evidence provenance, visible uncertainty, and retained human authority before users enter the operational workflow.
- 2026-09-07: Replaced fixture-only venture avatar styling with automatic two-letter monograms and stable name-derived colors for seeded and newly created ventures.
