# Especificacion: polynomial-evaluator

## Proposito

Verificar equivalencia algebraica de expresiones polinómicas en una variable mediante expansion y comparacion de coeficientes. Modulo nuevo en `src/domain/evaluator/polynomial-evaluator.ts`.

**Referencias**: `unit-2-pedagogical-slice/proposal.md` | `unit-2-pedagogical-slice/exploration.md`

---

## Requisitos

### Requirement: Representacion canonica del polinomio

El sistema DEBE representar todo polinomio como un arreglo de coeficientes ordenados por grado descendente. El polinomio cero DEBE tener grado 0 con coeficiente `[0]`. Los ceros a la izquierda DEBEN eliminarse durante la normalizacion.

### Requirement: Parsing de entradas

El sistema DEBE aceptar las siguientes formas de entrada:

| Forma | Ejemplo |
|-------|---------|
| Arreglo de coeficientes | `[1, -5, 6]` → x² - 5x + 6 |
| Expandida | `x^2 - 5x + 6` |
| Factorizada con factores `(x-a)` | `(x-2)(x-3)` |

El sistema DEBE rechazar: multivariable, exponentes racionales, funciones trascendentes, multiplicacion implicita ambigua (`2x` sin `*`).

### Requirement: Expansion completa

El sistema DEBE expandir completamente productos de factores a forma canonica de coeficientes.

### Requirement: Comparacion por coeficientes

Dos polinomios son equivalentes si y solo si tienen el mismo grado y cada par de coeficientes correspondiente es numericamente igual.

### Requirement: Modelo de errores

El sistema DEBE exportar dos tipos de error:

| Error | Campos |
|-------|--------|
| `PolynomialParseError` | `position: number`, `reason: string` |
| `UnsupportedPolynomialFormError` | `formType: string`, `reason: string` |

### Requirement: Casos borde

El sistema DEBE manejar correctamente: polinomio cero (`P(x) = 0`), polinomio constante, ceros iniciales (`0x² + 3x + 1` → `3x + 1`), coeficientes negativos, coeficientes en el rango de `Number.MAX_SAFE_INTEGER`.

### Requirement: Compromiso TDD

La implementacion DEBE alcanzar ≥90% branch coverage con grupos de tests para: parse, expand, equivalence, edge cases, error model.

---

## Escenarios

### Scenario: U2-POLY-001 — Parsing de forma expandida

- GIVEN la cadena `"2x^2 - 5x + 1"`
- WHEN se invoca `parsePolynomial`
- THEN devuelve `Polynomial` con coeficientes `[2, -5, 1]` y grado 2

### Scenario: U2-POLY-002 — Parsing de forma factorizada

- GIVEN la cadena `"(x-2)(x+3)"`
- WHEN se invoca `parsePolynomial`
- THEN devuelve `Polynomial` con coeficientes `[1, 1, -6]` (equivalente a x² + x - 6)

### Scenario: U2-POLY-003 — Parsing de arreglo de coeficientes

- GIVEN el arreglo `[1, 0, -4]`
- WHEN se invoca `parsePolynomial`
- THEN devuelve `Polynomial` con coeficientes `[1, 0, -4]` y grado 2

### Scenario: U2-POLY-004 — Equivalencia entre formas

- GIVEN `"(x-2)(x+3)"` y `"x^2 + x - 6"`
- WHEN se invoca `areEquivalent(a, b)`
- THEN devuelve `true`

### Scenario: U2-POLY-005 — No equivalencia

- GIVEN `"x^2 + x - 6"` y `"x^2 + x + 6"`
- WHEN se invoca `areEquivalent(a, b)`
- THEN devuelve `false`

### Scenario: U2-POLY-006 — Error de parsing con posicion

- GIVEN la cadena `"x^2 + *3"`
- WHEN se invoca `parsePolynomial`
- THEN lanza `PolynomialParseError` con `position` apuntando al caracter `*` y `reason` descriptivo

### Scenario: U2-POLY-007 — Forma no soportada multivariable

- GIVEN la cadena `"x*y + 3"`
- WHEN se invoca `parsePolynomial`
- THEN lanza `UnsupportedPolynomialFormError` con `formType: "multivariate"`

### Scenario: U2-POLY-008 — Polinomio cero

- GIVEN la cadena `"0"`
- WHEN se invoca `parsePolynomial`
- THEN devuelve `Polynomial` con coeficientes `[0]` y grado 0

### Scenario: U2-POLY-009 — Ceros iniciales se normalizan

- GIVEN el arreglo `[0, 0, 3, 1]`
- WHEN se invoca `parsePolynomial`
- THEN devuelve `Polynomial` con coeficientes `[3, 1]` y grado 1

### Scenario: U2-POLY-010 — Polinomios iguales por coeficientes

- GIVEN dos `Polynomial` con coeficientes `[2, -5, 1]`
- WHEN se invoca `polynomialsEqual(a, b)`
- THEN devuelve `true`

---

## API Contract (TypeScript)

```typescript
interface Polynomial {
  readonly coefficients: readonly number[]; // descending degree order
  readonly variable: string;                // default "x"
}

function parsePolynomial(input: string): Polynomial;
function expand(p: Polynomial): Polynomial;
function areEquivalent(a: string, b: string): boolean;
function polynomialsEqual(a: Polynomial, b: Polynomial): boolean;
```

---

## Impacto Pedagogico

**(alumno)**: El alumno escribe `(x-2)(x+3)` y la app confirma "correcto" cuando es equivalente a la respuesta esperada, sin importar la forma.

**(docente)**: El evaluador polinómico es confiable para todas las variantes de ejercicios U2; los errores de parsing y las formas no soportadas generan mensajes claros.

---

## Fuera de alcance

- Factorizacion inversa (expandir solo, no factorizar)
- Resolucion simbolica de ecuaciones
- Derivadas e integrales
- Polinomios multivariable
- Exponentes racionales o negativos
- Funciones trascendentes (sen, cos, log, exp)

---

## Referencias cruzadas

- `math-answer-evaluator`: este modulo se integra como evaluador pluggeable
- `math-render-safety`: las expresiones polinomicas se renderizan con KaTeX
- `math-exercise-model`: el tipo `symbolic` es el formato de input principal
