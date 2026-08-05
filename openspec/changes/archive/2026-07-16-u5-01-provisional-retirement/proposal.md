# Proposal: Provisional Unit 5 Static Retirement

## Binding Decision

Provisional Unit 5 was never exposed as a practicable user unit. U5-01 therefore retires static repository artifacts; it does not migrate student data.

## Scope

### In Scope

- Retire exactly six provisional skill IDs: `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, and `mat.u5.complejos_forma_polar`.
- Retire exactly five placeholder exercise IDs: `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1`.
- Remove active catalog, content, taxonomy, reference, specification, documentation, and test occurrences that represent those provisional artifacts.
- Permit the temporary empty Unit 5 catalog state through static catalog and specification changes.

### Out of Scope

- Student migration, sidecars, markers, write gates, blocking, persistence adapters, SQL, remote schema changes, and stored-data transforms.
- Canonical U5 content, structured-answer work, U3, U5-02, and archived U5-00 artifacts.

## Superseded Planning

All earlier U5-01 plans for per-student migration, local or remote sidecars, marker-last retry, SQL JSONB cleanup, persistence-write blocking, and persistence contract changes are discarded. They were premised on prior user exposure that never occurred.

## Success Criteria

- Only the verified 6-skill/5-exercise provisional inventory and its active repository references are retired.
- The temporary empty Unit 5 state is represented consistently in catalog, content, references, specifications, documentation, and tests.
- No migration or persistence work is introduced.
