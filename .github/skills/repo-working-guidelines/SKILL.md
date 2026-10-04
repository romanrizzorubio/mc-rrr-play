---
name: repo-working-guidelines
description: Check this repository's .junie guidelines and docs before making changes so work follows its conventions and project requirements.
---

# Repository working guidelines

Before working in this repository, consult the relevant guidance in `.junie/` and `docs/`.

- Check `.junie/` for applicable development rules and domain-specific guides. Follow the relevant guidelines when planning and implementing changes.
- Place reusable utility/helper modules in an appropriate `utils/` directory rather than beside feature-specific files; create the scoped directory when needed and update imports.
- Use `docs/README.md` as the documentation index, then read the documents relevant to the task to understand the intended behavior and architecture.
- When adding or editing card abilities, consult `.junie/guidelines/translation-guide.md` and `.junie/guidelines/effects-guide.md`. Consult `.junie/guidelines/targets-guide.md` when selecting or adding target selectors. Ensure each configured `ability.effect` resolves to one effect instance with a callable `canRun`; compose multiple effects with `EFFECT_CHAINED`, never by assigning an array directly.
- Keep general classes such as `Ability`, the base `Effect`, and factories free of branches for concrete cards or effect types. Put effect-specific parameter preparation in the concrete effect class and shared formula calculations in `Calc`.
- Read only the files relevant to the task; do not assume a guideline or specification that you have not checked.
- If guidance or documentation leaves an important behavior ambiguous, ask before making a consequential design choice.
