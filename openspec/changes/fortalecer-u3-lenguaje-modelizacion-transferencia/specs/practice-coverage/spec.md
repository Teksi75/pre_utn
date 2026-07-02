# Delta for practice-coverage

## ADDED Requirements

### Requirement: PR 1 — U3 guided algebraic modeling coverage

La práctica de Unidad 3 MUST cubrir la cadena evaluable: lenguaje verbal → definición de incógnita → planteo de ecuación → resolución → verificación → interpretación contextual. El impacto pedagógico MUST ayudar al alumno a modelar antes de operar y al docente a leer evidencia de comprensión, no solo aciertos numéricos.

#### Scenario: El alumno traduce una relación verbal simple

- Given un ejercicio U3 de lenguaje verbal con una relación directa
- When el alumno elige la expresión algebraica correcta
- Then el sistema valida la traducción
- And muestra feedback que conecta el texto con la expresión simbólica

#### Scenario: El alumno define una incógnita ambigua

- Given un enunciado que puede modelarse con distintas variables
- When el alumno selecciona una incógnita mal definida
- Then el sistema marca el error conceptual
- And explica por qué esa variable no representa la cantidad pedida

#### Scenario: El alumno plantea y resuelve una ecuación contextual

- Given un problema U3 con una incógnita y una relación suficiente
- When el alumno elige el planteo y la solución correcta
- Then el sistema acepta la respuesta
- And exige interpretar el resultado en el contexto del enunciado

#### Scenario: El alumno resuelve pero no verifica el resultado

- Given un problema U3 con solución algebraica válida
- When el alumno omite la verificación contextual
- Then el sistema debe tratar la respuesta como incompleta
- And muestra feedback sobre sustitución e interpretación de unidades o cantidades

### Requirement: PR 1 — Practice flow preserves base progression

El flujo `/practice` MUST incorporar la modelización U3 sin romper progreso, selección de skill, carga de teoría, ejemplos, ejercicios, feedback ni finalización. La modelización SHOULD ser aditiva y no convertir nuevas habilidades en prerrequisitos globales.

#### Scenario: El alumno inicia práctica de modelización U3

- Given una habilidad U3 de modelización disponible
- When el alumno la selecciona desde la práctica
- Then el sistema carga teoría, ejemplos, ejercicios y feedback coherentes
- And conserva el progreso previo de otras habilidades U3

#### Scenario: Habilidades U3 existentes siguen disponibles

- Given el alumno ya practicaba ecuaciones, rectas o sistemas de U3
- When se agrega la cobertura de modelización
- Then esas habilidades siguen accesibles sin bloqueo nuevo global
