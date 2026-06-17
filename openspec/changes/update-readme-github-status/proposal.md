# Proposal: Update README to reflect current project state

## Intent

README.md describes U1 as "en construcción" and omits U2 entirely. STATUS.json shows all 8 U1 skills and all 7 U2 skills are done and merged. The README is the first thing anyone sees on GitHub — it should not lie about project state.

## Scope

### In Scope
- Rewrite "Estado real del MVP" section: U1 complete, U2 complete, U3+ pending
- Add U2 skills table (polinomios_basico, operaciones_polinomios, ruffini_resto, factorizacion, gauss, mcm_mcd_polinomios, ecuaciones_fraccionarias)
- Update "Camino actual" tables for U1 and add U2 path
- Mention recent non-curriculum changes: student identity, redesign v4, catalog readiness UI
- Remove stale "en construcción" language for U1
- Keep README as a postal — no attempt to replace STATUS.json as source of truth

### Out of Scope
- Code or spec changes
- Adding U3+ content (not yet implemented)
- Detailed change history (lives in STATUS.json)
- GitHub Actions or CI badge updates

## Capabilities

None. This change is documentation-only; no spec-level behavior is being introduced or modified.

## Approach

Single-pass edit of README.md. Sections to touch:

| Section | Change |
|---------|--------|
| Estado real del MVP | Replace "en construcción" with accurate U1/U2 status; add U2 skills table |
| Camino actual de Unidad 1 | Already accurate (all 8 Listo) — verify only |
| Camino actual de Unidad 2 | New section: 7-skill path from polinomios_basico to ecuaciones_fraccionarias |
| Fuente de verdad | Add `openspec/changes/STATUS.json` as the portable state source |
| Recent changes note | One-liner mentioning identity, redesign, catalog readiness |

## Affected Areas

| File | Impact | Description |
|------|--------|-------------|
| `README.md` | Modified | Update status tables, add U2 path, fix stale copy |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| README drifts again after next merge | Medium | Add agent rule: "Update README when a unit completes" |
| Over-documenting change history in README | Low | Keep as postal; link to STATUS.json for detail |

## Rollback Plan

`git revert` the single README commit. No code dependencies.

## Dependencies

- `openspec/changes/STATUS.json` — read-only, already up to date

## Success Criteria

- [ ] U1 listed as "complete" (not "en construcción")
- [ ] U2 skills table present with all 7 skills
- [ ] No stale status claims remain
- [ ] README stays under 150 lines (postal, not manual)
- [ ] `git diff --stat` shows <150 changed lines
