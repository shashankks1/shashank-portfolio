# Codex Instructions - Portfolio Codebase

This repository is the implementation workspace for Shashank Kumar Sinha's portfolio website.

## Knowledge Base

Before making design, content, positioning, or architecture decisions for this portfolio, consult the Obsidian wiki:

`D:\SHAHSANK'S ENDEVOR\Portfolio` (the OneDrive copy is no longer the live one)

Start with:

1. `D:\SHAHSANK'S ENDEVOR\Portfolio\AGENTS.md` if present
2. `D:\SHAHSANK'S ENDEVOR\Portfolio\CLAUDE.md`
3. `D:\SHAHSANK'S ENDEVOR\Portfolio\00-Overview\Portfolio Plan.md` (locations, lineup, source map, open questions)
4. Relevant pages under `02-Design-System\`

## Current Project Rules

- Stack: plain HTML and CSS, no framework.
- Prefer existing project structure and styling conventions.
- Keep edits scoped and avoid unrelated refactors.
- Preserve the Figma-first workflow unless Shashank explicitly asks for code implementation.
- Use the Obsidian wiki as source of truth for project positioning, design tokens, constraints, and case study order.

## Portfolio Constraints

- No box-shadows anywhere.
- No scroll animations.
- One hover transition only: nav underline slides in from left.
- Magenta/accent appears only on project category tags.
- Home project layout is asymmetric: one featured project plus two smaller projects.
- Body text max-width is 65ch.
- Avoid cards with backgrounds; use whitespace for separation.

## Codex Workflow

When asked to make portfolio changes:

1. Read the relevant local code files.
2. Read the relevant Obsidian wiki notes.
3. State any conflict between code and wiki before editing.
4. Make the smallest coherent change.
5. Verify with available local checks.
