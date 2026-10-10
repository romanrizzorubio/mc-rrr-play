---
name: effect-condition-exclusions
description: Configure generic effect-target exclusions from runtime parameter paths and array wildcards.
---

# Effect condition exclusions

Use route-based condition parameters before adding a predicate or effect-specific target-filtering method.

## `EFFECT_FOR_EACH` exclusions

- Every configuration field named `target`, including `limit.target` and `maximum.target`, must use a `TARGET_*` constant, not a `PLACE_*`, `TIME_*`, or other namespace constant. Define `limit` and `maximum` scopes with `target`, never `time`. If no matching target constant exists, define a `TARGET_*` alias from the appropriate existing constant in `mc-shared/constants/targets.js`. Effect `params.target` values need a resolver; limit/maximum scope targets are metadata and need not resolve as effect selectors. A `limit` applies to its ability instance, while a `maximum` aggregates matching card names.
- Configure `condition.exclude` with one path or an array of paths.
- Paths are resolved against the runtime parameters passed to the effect, including outputs from earlier effects in an `EFFECT_CHAINED`.
- Use `*` to expand array entries. For example, to exclude players targeted by earlier attacks:

  ```js
  condition: {
      exclude: [
          'effects.0.attacks.*.selectedTarget',
          'effects.0.attacks.*.defender.owner',
      ],
  }
  ```

- Point paths at target objects, not their IDs. Exclusion matches target identity or matching `id`.
- Prefer this declarative configuration over card-specific keys such as `excludeIfAttackedBy`, custom callbacks, or helper methods on `ForEachEffect`.
- Do not branch on `TARGET_ALL_PLAYERS` or another specific selector in `ForEachEffect`; pass the configured target to the normal resolver and preserve the resolved order when filtering.
- Validate that exclusion paths are non-empty strings. Test wildcard expansion over arrays, missing values, multiple paths, and target matching.
- Exercise the configured `ForEachEffect` using representative runtime parameters, including the actual nesting of results from earlier `EFFECT_CHAINED` steps. Assert which targets are excluded and which remain; checking `path()` or the `condition.exclude` configuration alone does not verify effect-context wiring.
- If the route syntax or matching behavior changes, update `.junie/guidelines/effects-guide.md` and its tests.
