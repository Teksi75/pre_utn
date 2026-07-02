/**
 * Error taxonomy — static collection of normalized mathematics error tags.
 * No external dependencies. Pure TypeScript.
 */

import type { ErrorTag } from "../models/error-tag";

/**
 * Static error taxonomy data.
 * Each tag follows u{1-6}_{slug} pattern, with at least 2 tags per unit.
 * These are original pedagogical transformations, not verbatim canonical content.
 */
const TAXONOMY: readonly ErrorTag[] = [
  // Unit 1: Algebraic expressions
  {
    id: "u1_orden_operaciones",
    unit: 1,
    description:
      "Error en el orden de operaciones: resuelve sumas antes que multiplicaciones o divisiones.",
    examples: [
      "Calcular 2 + 3 × 4 como (2+3)×4 = 20 en vez de 2+12 = 14",
      "Resolver 10 - 2² como (10-2)² = 64 en vez de 10-4 = 6",
    ],
  },
  {
    id: "u1_signo_racionalizacion",
    unit: 1,
    description:
      "Error al aplicar signo en racionalización: olvida cambiar signo del numerador o denominador al multiplicar por el conjugado.",
    examples: [
      "Racionalizar 1/(√2 - 1) y escribir (√2 + 1)/(2 - 1) en vez de (√2 + 1)/(1)",
      "Olvidar cambiar signo al multiplicar por conjugado",
    ],
  },
  {
    id: "u1_rac_multiplica_solo_denominador",
    unit: 1,
    description:
      "Error al racionalizar: multiplica solo el denominador por el factor racionalizante, dejando el numerador sin modificar. Esto cambia el valor de la fracción y produce un resultado no equivalente.",
    examples: [
      "Racionalizar 1/√2 como √2/√4 (multiplica √2 sólo abajo) en vez de multiplicar también arriba",
      "Para 5/(2√3), multiplicar abajo por √3 y dejar 5 arriba sin distribuir",
    ],
  },
  {
    id: "u1_rac_factor_incorrecto",
    unit: 1,
    description:
      "Error al racionalizar: elige un factor racionalizante que no cancela la raíz del denominador, o que cancela algo que no debía cancelar (como el coeficiente entero).",
    examples: [
      "Multiplicar 1/√2 por 2/2 pensando que '2' es el factor racionalizante",
      "Para 1/√[3]{2}, multiplicar por √[3]{2} en vez de √[3]{4} (no completa el cubo)",
    ],
  },
  {
    id: "u1_rac_conjugado_incorrecto",
    unit: 1,
    description:
      "Error al racionalizar binomios: elige un conjugado con el mismo signo en vez del opuesto, o cambia el signo de las dos raíces en lugar de una sola. El producto con mismo signo NO es diferencia de cuadrados.",
    examples: [
      "Para 1/(√5 - 2), multiplicar por (√5 - 2)/(√5 - 2) (mismo signo) en vez de (√5 + 2)/(√5 + 2)",
      "Para 2/(√3 + √2), multiplicar por -(√3 - √2) en vez de (√3 - √2)",
    ],
  },
  {
    id: "u1_rac_signo_conjugado",
    unit: 1,
    description:
      "Error al racionalizar: invierte los signos del numerador y del denominador de manera inconsistente al multiplicar por el conjugado, perdiendo la equivalencia de la fracción.",
    examples: [
      "Racionalizar 1/(√2 - 1) y obtener -(√2 + 1)/-(2 - 1) (cambia signos innecesariamente)",
      "Aplicar cambio de signo al numerador del conjugado cuando no corresponde",
    ],
  },
  {
    id: "u1_rac_no_simplifica",
    unit: 1,
    description:
      "Error al racionalizar: obtiene una respuesta con denominador racionalizado pero no simplifica el resultado, dejando factores comunes sin cancelar o raíces anidadas innecesarias.",
    examples: [
      "Racionalizar 6/√2 como (6√2)/2 en vez de simplificar a 3√2",
      "Dejar (5√3)/10 sin simplificar a √3/2",
    ],
  },
  {
    id: "u1_rac_confunde_raiz_potencia",
    unit: 1,
    description:
      "Error al racionalizar raíces de índice mayor: confunde raíz con potencia y aplica mal la regla de completar el exponente. Trata √[n]{a^m} como a^{m/n} o a^{n/m} sin operar correctamente.",
    examples: [
      "Racionalizar 1/√[3]{2} usando √[3]{2} en vez de √[3]{4} porque '2^1 = 2 ya está'",
      "Pensar que √[3]{2^2} = (√[3]{2})^2 = 2 (no aplica distributiva a la raíz)",
    ],
  },
  {
    id: "u1_rac_usa_exponente_negativo",
    unit: 1,
    description:
      "Error al racionalizar: reescribe 1/√a como √a^{-1} o a^{-1/2} creyendo que ya racionalizó. El denominador sigue teniendo una raíz, sólo se la 'esconde' en el numerador. Esto NO cumple el objetivo de racionalizar.",
    examples: [
      "Racionalizar 1/√2 como (√2)^{-1} o 2^{-1/2}",
      "Creer que x^{-1} = x y entonces 'el denominador ya no tiene raíz'",
    ],
  },
  {
    id: "u1_rac_pierde_equivalencia",
    unit: 1,
    description:
      "Error al racionalizar: aplica operaciones que pierden la equivalencia entre la fracción original y la respuesta, típicamente al distribuir o simplificar incorrectamente el numerador luego de multiplicar por el conjugado.",
    examples: [
      "Racionalizar 2/(√3 + √2) y obtener √3 - √2 (pierde el factor 2 al distribuir)",
      "Racionalizar 1/(√5 - 2) y obtener (√5 + 2)/(-1) en vez de √5 + 2",
    ],
  },

  // Unit 1: Números complejos — error tags backed by the Unit 1 SDD sequence
  // and regression coverage in src/domain/__tests__/complejos-domain.test.ts.
  {
    id: "u1_complejo_i_definicion",
    unit: 1,
    description:
      "Confusión sobre la naturaleza del número imaginario i: trata a i como un número real o cree que √(-1) es un número real. i no es un número real; i se define mediante la relación i² = -1, y los números que lo incluyen pertenecen a los complejos.",
    examples: [
      "Decir que $i$ es un número real 'porque √(−1) existe en ℝ'",
      "Afirmar que $i = −1$ (confunde $i$ con su cuadrado)",
    ],
  },
  {
    id: "u1_complejo_partes_confusion",
    unit: 1,
    description:
      "Confusión entre la parte real y la parte imaginaria de un complejo: invierte Re(z) con Im(z). En a+bi, la parte real es a y la parte imaginaria es b (el coeficiente de i, sin la unidad). No es a+bi con Re=b.",
    examples: [
      "Decir que Re(2+3i) = 3 en vez de 2",
      "Afirmar que Im(4−5i) = 5 (olvida el signo del coeficiente de i)",
    ],
  },
  {
    id: "u1_complejo_suma_real",
    unit: 1,
    description:
      "Suma de complejos ignorando la componente imaginaria: trata la suma como si solo importaran las partes reales. La suma se hace componente a componente: (a+bi)+(c+di) = (a+c)+(b+d)i.",
    examples: [
      "Calcular (2+3i)+(4+5i) = 6 en vez de 6+8i (ignora las partes imaginarias)",
      "Calcular (1+2i)+(3−4i) = 4 en vez de 4−2i",
    ],
  },
  {
    id: "u1_complejo_i_cuadrado_signo",
    unit: 1,
    description:
      "Error en el signo de i²: olvida que i² = −1 y usa i² = 1 o i² = i al multiplicar complejos. Esto cambia el signo del término y produce un resultado incorrecto.",
    examples: [
      "En (2+3i)(1+i), calcular 3i·i = 3 en vez de 3·(−1) = −3",
      "Simplificar i² como i (trata el exponente como factor en vez de potencia)",
    ],
  },
  {
    id: "u1_complejo_conjugado_signo",
    unit: 1,
    description:
      "Error en el signo del conjugado: escribe el conjugado de a+bi como a+bi (sin cambio) o como −a−bi (cambia ambos signos). El conjugado solo cambia el signo de la parte imaginaria: conj(a+bi) = a−bi.",
    examples: [
      "Escribir conj(3+4i) = 3+4i en vez de 3−4i",
      "Escribir conj(2−5i) = −2+5i en vez de 2+5i",
    ],
  },
  {
    id: "u1_complejo_division_sin_conjugado",
    unit: 1,
    description:
      "División de complejos sin multiplicar por el conjugado: intenta dividir directamente las partes reales e imaginarias sin racionalizar el denominador. La división requiere multiplicar numerador y denominador por el conjugado del denominador.",
    examples: [
      "Calcular (1+i)/(2+i) como 1/2 + (1/1)i = 0.5 + i",
      "Dividir 3/(1−i) como 3/1 − 3/i sin usar el conjugado",
    ],
  },
  {
    id: "u1_complejo_potencia_ciclo",
    unit: 1,
    description:
      "Error al aplicar el ciclo de potencias de i: no reconoce el patrón cíclico i¹=i, i²=−1, i³=−i, i⁴=1 y su repetición. Calcula iⁿ sin reducir el exponente módulo 4.",
    examples: [
      "Calcular i⁵ = 1 en vez de i (porque 5 mod 4 = 1 → i¹ = i)",
      "Decir que i¹⁰ = i² = −1 en vez de i¹⁰ = i² = −1 correcto, o errar en: i⁷ = −1 en vez de −i",
    ],
  },
  {
    id: "u1_complejo_igualdad_parcial",
    unit: 1,
    description:
      "Considera dos complejos iguales si solo coinciden en la parte real o solo en la imaginaria. La igualdad de complejos requiere que ambas partes coincidan: a+bi = c+di ⟺ a=c ∧ b=d.",
    examples: [
      "Decir que 2+5i = 2+3i 'porque la parte real es 2 en ambas'",
      "Afirmar que 4+7i = 1+7i 'porque la parte imaginaria es igual'",
    ],
  },

  // Unit 1: Logaritmos — error tags backed by the Unit 1 SDD sequence
  // and regression coverage in src/domain/__tests__/logaritmos-domain.test.ts.
  {
    id: "u1_log_base_invalida",
    unit: 1,
    description:
      "Error al evaluar un logaritmo con base inválida: usa base ≤ 0 o base = 1. La base debe ser positiva y distinta de 1: a > 0 ∧ a ≠ 1.",
    examples: [
      "Calcular $\\log_{-2}(8)$ como si fuera válido",
      "Calcular $\\log_{1}(5)$ creyendo que da 0",
    ],
  },
  {
    id: "u1_log_argumento_no_positivo",
    unit: 1,
    description:
      "Error al evaluar un logaritmo con argumento no positivo: intenta calcular logaritmo de cero o de un número negativo. El argumento debe ser estrictamente positivo: b > 0.",
    examples: [
      "Calcular $\\log_{2}(0)$ como si diera 0",
      "Calcular $\\log_{3}(-9)$ como si diera 2",
    ],
  },
  {
    id: "u1_log_confunde_base_argumento",
    unit: 1,
    description:
      "Error al identificar la base y el argumento en un logaritmo: confunde cuál es la base y cuál es el argumento, intercambiando sus roles.",
    examples: [
      "En $\\log_{2}(8)$, tomar 8 como base y 2 como argumento",
      "En $\\log_{10}(100)$, confundir y pensar que la base es 100",
    ],
  },
  {
    id: "u1_log_confunde_resultado_exponente",
    unit: 1,
    description:
      "Error al interpretar el resultado de un logaritmo: confunde el valor del logaritmo con la base o el argumento, en lugar de reconocer que es el exponente al que hay que elevar la base para obtener el argumento.",
    examples: [
      "Decir que $\\log_{2}(8) = 2$ porque $2^2 = 4$ en vez de $2^3 = 8$",
      "Decir que $\\log_{10}(1000) = 100$ en vez de 3",
    ],
  },
  {
    id: "u1_log_conversion_exponencial",
    unit: 1,
    description:
      "Error al convertir entre forma logarítmica y exponencial: aplica incorrectamente la equivalencia $\\log_a(b) = c \\Leftrightarrow a^c = b$.",
    examples: [
      "Convertir $\\log_{2}(8) = 3$ como $2^8 = 3$ en vez de $2^3 = 8$",
      "Convertir $5^2 = 25$ como $\\log_{5}(2) = 25$ en vez de $\\log_{5}(25) = 2$",
    ],
  },
  {
    id: "u1_log_propiedad_aplicada_mal",
    unit: 1,
    description:
      "Error al aplicar propiedades básicas de logaritmos: confunde producto con suma, cociente con resta, o potencia con multiplicación de manera incorrecta.",
    examples: [
      "Aplicar $\\log(a \\cdot b) = \\log(a) \\cdot \\log(b)$ en vez de $\\log(a) + \\log(b)$",
      "Aplicar $\\log(a^n) = n \\cdot \\log(a)$ como $\\log(a^n) = \\log(a)^n$",
    ],
  },

  {
    id: "u1_error_intervalo",
    unit: 1,
    description:
      "Error al evaluar operaciones con intervalos: confunde notación de intervalo abierto/cerrado o aplica operaciones incorrectamente sobre extremos.",
    examples: [
      "Unir [1,3] y [3,5] como [1,5) en vez de [1,5]",
      "Sumar extremos de [2,4] y [1,3] como [3,7] sin considerar intersección",
    ],
  },
  {
    id: "u1_extremo_inclusion",
    unit: 1,
    description:
      "Error al determinar inclusión de extremos en intervalos: usa paréntesis cuando debería usar corchetes o viceversa.",
    examples: [
      "Escribir x > 3 como [3,∞) en vez de (3,∞)",
      "Escribir x ≤ 5 como (−∞,5) en vez de (−∞,5]",
    ],
  },
  {
    id: "u1_propiedad_operacion",
    unit: 1,
    description:
      "Error al aplicar propiedades de operaciones con reales: distribuye mal o confunde conmutatividad con asociatividad.",
    examples: [
      "Aplicar a(b + c) = ab + c en vez de ab + ac",
      "Calcular -(2 + 3) como -2 + 3 = 1 en vez de -5",
    ],
  },
  {
    id: "u1_agrupacion_signo",
    unit: 1,
    description:
      "Error al agrupar términos con signos: pierde o cambia signo al reorganizar sumas y restas.",
    examples: [
      "Calcular 5 - 3 + 2 como 5 - (3 + 2) = 0 en vez de 4",
      "Reordenar 7 - 4 + 1 como 7 + 1 - 4 y olvidar que el signo original era negativo",
    ],
  },
  {
    id: "u1_signo_parentesis",
    unit: 1,
    description:
      "Error al interpretar potencia con base negativa: confunde (-a)^n con -a^n, olvidando que los paréntesis incluyen al signo negativo.",
    examples: [
      "Calcular $(-3)^2 = -9$ en vez de $9$, confundiendo $(-3)\\times(-3)$ con $-(3\\times3)$",
      "Calcular $(-2)^3 = 8$ en vez de $-8$, invirtiendo la regla de signos",
    ],
  },

  // Unit 1: Potencias y raíces — error tags backed by the Unit 1 SDD sequence
  // and regression coverage in src/domain/__tests__/error-taxonomy.test.ts.
  {
    id: "u1_exponente_cero",
    unit: 1,
    description:
      "Error al evaluar exponente cero: cree que cualquier número elevado a la potencia cero es 0 en vez de 1.",
    examples: [
      "Calcular $5^0 = 0$ en vez de $1$",
      "Calcular $(-3)^0 = 0$ en vez de $1$",
    ],
  },
  {
    id: "u1_producto_potencias",
    unit: 1,
    description:
      "Error al multiplicar potencias de distinta base: suma los exponentes cuando las bases son diferentes, o multiplica los exponentes en vez de sumarlos.",
    examples: [
      "Calcular $2^3 \\times 3^2$ como $6^5$ en vez de $8 \\times 9 = 72$",
      "Calcular $2^3 \\times 2^4$ como $2^{12}$ en vez de $2^7 = 128$",
    ],
  },
  {
    id: "u1_cociente_potencias",
    unit: 1,
    description:
      "Error al dividir potencias de distinta base: resta los exponentes cuando las bases son diferentes, o aplica la regla incorrectamente.",
    examples: [
      "Calcular $6^4 \\div 3^2$ como $2^2 = 4$ en vez de $36$",
      "Calcular $5^6 \\div 5^2$ como $5^3$ en vez de $5^4 = 625$",
    ],
  },
  {
    id: "u1_potencia_de_potencia",
    unit: 1,
    description:
      "Error al elevar una potencia a otra potencia: suma los exponentes en vez de multiplicarlos, o no aplica la regla $(a^m)^n = a^{m\\times n}$.",
    examples: [
      "Calcular $(2^3)^2$ como $2^5 = 32$ en vez de $2^6 = 64$",
      "Calcular $(3^2)^3$ como $3^5 = 243$ en vez de $3^6 = 729$",
    ],
  },
  {
    id: "u1_raiz_principal",
    unit: 1,
    description:
      "Error al calcular raíz cuadrada: responde con el valor negativo en vez de la raíz principal (no negativa).",
    examples: [
      "Calcular $\\sqrt{9} = -3$ en vez de $3$",
      "Calcular $\\sqrt{25} = -5$ en vez de $5$",
    ],
  },
  {
    id: "u1_raiz_negativa_par",
    unit: 1,
    description:
      "Error al evaluar raíz par de número negativo: afirma que existe resultado real en vez de reconocer que no tiene raíz real.",
    examples: [
      "Afirmar que $\\sqrt{-4}$ pertenece a los números reales",
      "Decir que $\\sqrt{-9} = -3$ en vez de que no existe en los reales",
    ],
  },
  {
    id: "u1_confunde_natural_entero",
    unit: 1,
    description:
      "Error al clasificar un entero negativo como natural: cree que un número negativo pertenece a $\\mathbb{N}$ en vez de a $\\mathbb{Z}$.",
    examples: [
      "Decir que $-4 \\in \\mathbb{N}$ en vez de $-4 \\in \\mathbb{Z} \\setminus \\mathbb{N}$",
      "Ubicar $-3$ dentro del conjunto de los naturales al operar clasificaciones",
    ],
  },
  {
    id: "u1_confunde_racional_irracional",
    unit: 1,
    description:
      "Error al distinguir racional de irracional: trata un decimal periódico como irracional o afirma que una raíz no es racional sin verificar si se puede escribir como fracción.",
    examples: [
      "Decir que $0,333\\dots$ es irracional en vez de racional ($= 1/3$)",
      "Decir que $\\sqrt{9}$ es irracional en vez de $3 \\in \\mathbb{N}$",
    ],
  },
  {
    id: "u1_toda_raiz_irracional",
    unit: 1,
    description:
      "Error al generalizar: asume que toda raíz es irracional, sin distinguir entre raíces que dan un resultado entero o racional y raíces cuyo resultado no puede escribirse como fracción exacta.",
    examples: [
      "Decir que $\\sqrt{9}$ es irracional en vez de $3 \\in \\mathbb{N}$",
      "Decir que $\\sqrt{25}$ es irracional en vez de $5 \\in \\mathbb{N}$",
    ],
  },
  {
    id: "u1_raiz_negativa_en_reales",
    unit: 1,
    description:
      "Error al evaluar raíz de un número negativo dentro de los reales: afirma que $\\sqrt{-a}$ pertenece a $\\mathbb{R}$ en vez de reconocer que no tiene resultado real.",
    examples: [
      "Decir que $\\sqrt{-4} \\in \\mathbb{R}$ en vez de indicar que no pertenece a $\\mathbb{R}$",
      "Decir que $\\sqrt{-9} = -3$ como si viviera en los reales",
    ],
  },
  {
    id: "u1_conjunto_minimo",
    unit: 1,
    description:
      "Error al elegir el conjunto más pequeño: cuando se pide el menor conjunto al que pertenece un número, escoge uno más amplio en vez del primero de la cadena $\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}$ que lo contenga.",
    examples: [
      "Decir que $7 \\in \\mathbb{Z}$ cuando se pide el conjunto más pequeño (debería ser $\\mathbb{N}$)",
      "Decir que $-2 \\in \\mathbb{Q}$ cuando se pide el más pequeño (debería ser $\\mathbb{Z}$)",
    ],
  },
  {
    id: "u1_pertenencia_vs_inclusion",
    unit: 1,
    description:
      "Error al confundir pertenencia ($\\in$) con inclusión ($\\subset$): usar $\\subset$ cuando el sujeto es un elemento (no un conjunto). Pertenencia relaciona elemento con conjunto; inclusión relaciona conjunto con conjunto.",
    examples: [
      "Escribir $5 \\subset \\mathbb{Z}$ en vez de $5 \\in \\mathbb{Z}$ (5 es un elemento, no un conjunto)",
      "Escribir $\\mathbb{Q} \\in \\mathbb{R}$ en vez de $\\mathbb{Q} \\subset \\mathbb{R}$ ($\\mathbb{Q}$ es un conjunto, no un elemento)",
    ],
  },
  {
    id: "u1_inclusion_chain_order",
    unit: 1,
    description:
      "Error en el orden de la cadena de inclusiones: invertir $\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}$ o afirmar que un conjunto contiene a uno mayor en la cadena.",
    examples: [
      "Escribir $\\mathbb{Z} \\subset \\mathbb{N}$ en vez de $\\mathbb{N} \\subset \\mathbb{Z}$",
      "Afirmar que $\\mathbb{R} \\subset \\mathbb{Q}$ cuando en realidad es $\\mathbb{Q} \\subset \\mathbb{R}$",
    ],
  },
  {
    id: "u1_n_sin_cero",
    unit: 1,
    description:
      "Error al clasificar el cero como número natural: por la convención N-sin-cero, $0 \\notin \\mathbb{N}$. Cero pertenece a $\\mathbb{Z}$, $\\mathbb{Q}$ y $\\mathbb{R}$, pero no a $\\mathbb{N}$.",
    examples: [
      "Decir que $0 \\in \\mathbb{N}$",
      "Definir $\\mathbb{N} = \\{0, 1, 2, \\ldots\\}$ (la convención del proyecto excluye al 0)",
    ],
  },
  {
    id: "u1_racional_tambien_es_real",
    unit: 1,
    description:
      "Error al tratar racionales y reales como conjuntos disjuntos: cree que $\\mathbb{Q}$ y $\\mathbb{R}$ no se solapan. En realidad $\\mathbb{Q} \\subset \\mathbb{R}$: todo racional es real. La diferencia es que $\\mathbb{R}$ también incluye a los irracionales $\\mathbb{R} \\setminus \\mathbb{Q}$.",
    examples: [
      "Decir que $\\frac{2}{5}$ solo pertenece a $\\mathbb{Q}$ y no a $\\mathbb{R}$",
      "Clasificar $0{,}75$ como irracional porque no se da cuenta de que es real y racional a la vez",
    ],
  },
  {
    id: "u1_entero_no_siempre_natural",
    unit: 1,
    description:
      "Error al asumir que todo entero es natural: por la convención N-sin-cero, los naturales no incluyen al cero ni a los negativos. Solo los enteros positivos $\{1, 2, 3, \\ldots\\}$ son naturales.",
    examples: [
      "Decir que $-3 \\in \\mathbb{N}$ porque es entero",
      "Decir que $0 \\in \\mathbb{N}$ porque es entero (convención N-sin-cero lo excluye)",
    ],
  },
  {
    id: "u1_negativo_puede_ser_racional",
    unit: 1,
    description:
      "Error al creer que los números negativos no pueden ser racionales: un racional es todo número que puede escribirse como $\\frac{a}{b}$ con $a, b \\in \\mathbb{Z}$ y $b \\neq 0$. El numerador puede ser negativo.",
    examples: [
      "Decir que $-\\frac{4}{1}$ no es racional porque es negativo",
      "Excluir a $-\\frac{2}{5}$ de $\\mathbb{Q}$ por tener signo negativo",
    ],
  },
  {
    id: "u1_decimal_no_es_siempre_irracional",
    unit: 1,
    description:
      "Error al generalizar que todo decimal es irracional: los decimales finitos y los periódicos son racionales. Solo los decimales no-periódicos e infinitos (como la expansión de $\\sqrt{2}$) son irracionales. La clave es si los dígitos se repiten o no.",
    examples: [
      "Decir que $0{,}75$ es irracional porque es un decimal (en realidad es $3/4 \\in \\mathbb{Q}$)",
      "Decir que $0{,}3\\overline{3}$ es irracional porque no termina (en realidad es $1/3 \\in \\mathbb{Q}$)",
    ],
  },
  {
    id: "u1_toda_raiz_no_es_irracional",
    unit: 1,
    description:
      "Error al generalizar que toda raíz es irracional: cuando el radicando es un cuadrado perfecto (o un cociente de cuadrados perfectos), la raíz es exacta y da un número racional. La raíz de $9$, $16$, $25$, $4/9$ es entera o fraccionaria.",
    examples: [
      "Decir que $\\sqrt{9}$ es irracional (en realidad $\\sqrt{9} = 3 \\in \\mathbb{N}$)",
      "Decir que $\\sqrt{25}$ es irracional (en realidad $\\sqrt{25} = 5 \\in \\mathbb{N}$)",
    ],
  },
  {
    id: "u1_decimal_periodico_es_racional",
    unit: 1,
    description:
      "Concepto clave: todo decimal periódico (cuyos dígitos se repiten infinitamente según un patrón) es racional. La repetición periódica es la firma de un número racional — significa que puede escribirse como fracción exacta.",
    examples: [
      "Decir que $0{,}3\\overline{3}$ es irracional porque 'no termina' (en realidad $0{,}3\\overline{3} = 1/3 \\in \\mathbb{Q}$)",
      "Decir que $0{,}\\overline{142857}$ es irracional (en realidad $0{,}\\overline{142857} = 1/7 \\in \\mathbb{Q}$)",
    ],
  },
  {
    id: "u1_raiz_cuadrada_exacta_es_racional",
    unit: 1,
    description:
      "Concepto clave: una raíz cuadrada de un cuadrado perfecto (o cociente de cuadrados perfectos) es exacta y da un número racional. $\\sqrt{9} = 3$, $\\sqrt{16} = 4$, $\\sqrt{25} = 5$ son enteros racionales. Solo las raíces no exactas ($\\sqrt{2}$, $\\sqrt{3}$, $\\sqrt{5}$) son irracionales.",
    examples: [
      "Clasificar $\\sqrt{9}$ como irracional cuando en realidad $\\sqrt{9} = 3 \\in \\mathbb{N}$",
      "Asumir que $\\sqrt{25/4}$ es irracional cuando en realidad $\\sqrt{25/4} = 5/2 \\in \\mathbb{Q}$",
    ],
  },

  // Unit 1: Valor absoluto — error tags backed by the Unit 1 SDD sequence
  // and regression coverage in src/domain/__tests__/valor-absoluto-domain.test.ts.
  {
    id: "u1_abs_signo_incorrecto",
    unit: 1,
    description:
      "Error al calcular valor absoluto: escribe |−5| = −5 tratando el valor absoluto como identidad, sin cambiar el signo.",
    examples: [
      "Calcular |−5| = −5 en vez de 5",
      "Calcular |−3| = −3 en vez de 3",
    ],
  },
  {
    id: "u1_abs_cero",
    unit: 1,
    description:
      "Error al evaluar |0|: cree que |0| es indefinido, o que da un valor distinto de 0.",
    examples: [
      "Decir que |0| no está definido",
      "Decir que |0| = 1 en vez de 0",
    ],
  },
  {
    id: "u1_abs_distancia_no_signo",
    unit: 1,
    description:
      "Error al interpretar el valor absoluto: confunde distancia con signo, tratando |a| como si tuviera dirección.",
    examples: [
      "Decir que |−7| = −7 porque 'el signo indica la posición'",
      "Interpretar |a| como un número con signo en vez de magnitud",
    ],
  },
  {
    id: "u1_abs_no_negativo",
    unit: 1,
    description:
      "Error de no negatividad: responde con un valor negativo al calcular un valor absoluto, violando que |a| ≥ 0 siempre.",
    examples: [
      "Decir que |−4| = −4",
      "Calcular |−12| y obtener un resultado negativo",
    ],
  },
  {
    id: "u1_abs_confunde_opuesto",
    unit: 1,
    description:
      "Error al confundir opuesto con valor absoluto: cree que |a| = −a incondicionalmente, sin verificar si a ≥ 0.",
    examples: [
      "Calcular |5| = −5 confundiendo con el opuesto",
      "Aplicar |a| = −a para todo a sin distinguir el caso a ≥ 0",
    ],
  },
  {
    id: "u1_abs_distancia_entre_reales",
    unit: 1,
    description:
      "Error al calcular |a − b|: invierte el orden de la resta o calcula la distancia incorrectamente.",
    examples: [
      "Calcular |3 − 7| como 3 − 7 = −4 en vez de 4",
      "Calcular |−2 − 5| como −7 en vez de 7",
    ],
  },
  {
    id: "u1_abs_sqrt_cuadrado",
    unit: 1,
    description:
      "Error al simplificar √(x²): olvida que √(x²) = |x| y simplifica √((−3)²) = −3 en vez de 3.",
    examples: [
      "Calcular √((−3)²) = −3 en vez de |−3| = 3",
      "Simplificar √((−5)²) como −5 en vez de 5",
    ],
  },
  {
    id: "u1_abs_doble_solucion",
    unit: 1,
    description:
      "Error al resolver |x| = a: escribe solo x = a y olvida la segunda solución x = −a.",
    examples: [
      "Resolver |x| = 4 y dar solo x = 4, olvidando x = −4",
      "Decir que |x| = 7 tiene una única solución x = 7",
    ],
  },
  {
    id: "u1_abs_distributiva_falsa",
    unit: 1,
    description:
      "Error de falsa distributividad: aplica |a + b| = |a| + |b| como si fuera siempre válida, ignorando la desigualdad triangular.",
    examples: [
      "Calcular |−3 + 5| como |−3| + |5| = 8 en vez de 2",
      "Asumir que |a + b| = |a| + |b| siempre se cumple",
    ],
  },

  // Unit 2: Aplicaciones — MCM/MCD and fractional equations
  {
    id: "u2_denominador_cero",
    unit: 2,
    description:
      "Incluye como solución un valor que anula un denominador de la ecuación fraccionaria original. El alumno resuelve algebraicamente pero no verifica las restricciones de dominio.",
    examples: [
      "Resolver 1/(x-2) = 3/(x-2) y dar x=2 como solución",
      "Resolver x/(x-3) = 3/(x-3) y dar x=3 como solución",
    ],
  },
  {
    id: "u2_confunde_mcm_mcd",
    unit: 2,
    description:
      "Confunde MCM con MCD: al pedir el mínimo común múltiplo responde el máximo común divisor, o viceversa. Intercambia la operación de unión de factores (MCM) con la de intersección (MCD).",
    examples: [
      "Pedir MCM de (x-2)(x-3) y (x-2)(x+1) y responder (x-2) (que es el MCD)",
      "Pedir MCD de x²-4 y x²-2x y responder x(x-2)(x+2) (que es el MCM)",
    ],
  },

  // Unit 2: Equations and systems
  {
    id: "u2_aislamiento_variable",
    unit: 2,
    description:
      "Error al aislar la variable: olvida aplicar la misma operación a ambos lados de la ecuación.",
    examples: [
      "En 2x = 6, escribir x = 6 en vez de x = 3",
      "En x/3 = 4, escribir x = 4 en vez de x = 12",
    ],
  },
  {
    id: "u2_signo_al_mover",
    unit: 2,
    description:
      "Error de signo al mover términos: no cambia el signo al pasar un término de un lado al otro.",
    examples: [
      "En x + 5 = 3, escribir x = 3 + 5 en vez de x = 3 - 5",
      "En 2x - 1 = 7, escribir 2x = 7 - 1 en vez de 2x = 7 + 1",
    ],
  },

  // Unit 2: Polynomial errors (cap 1-11, UNIDAD2_matemática.pdf)
  {
    id: "u2_signo_operacion",
    unit: 2,
    description:
      "Error de signo al operar con polinomios: olvida distribuir el signo negativo al restar, o cambia incorrectamente el signo de los términos al aplicar la propiedad distributiva. La resta de polinomios equivale a sumar el opuesto: P(x) − Q(x) = P(x) + (−Q(x)).",
    examples: [
      "Calcular (3x² − 2x + 1) − (x² + 4x − 3) como 2x² − 6x − 2 en vez de 2x² − 6x + 4 (error al distribuir el − en −(−3))",
      "En (2x + 1)(x − 3), escribir 2x² − 5x − 3 como 2x² + 5x − 3 (error de signo en el término cruzado −6x + 1x)",
    ],
  },
  {
    id: "u2_termino_semejante",
    unit: 2,
    description:
      "Error al combinar términos semejantes: suma coeficientes de términos con distinto grado (ej. 3x² + 2x = 5x²) o no reduce correctamente términos del mismo grado. Solo se pueden sumar/restar términos que tienen exactamente la misma parte literal (misma variable y mismo exponente).",
    examples: [
      "Simplificar 3x² + 2x como 5x² en vez de 3x² + 2x (no se pueden sumar grados distintos)",
      "Simplificar 4x³ − x³ + 2x² como 3x³ + 2x² (correcto) pero escribir 5x⁵ (incorrecto — confunde suma de coeficientes con suma de exponentes)",
    ],
  },
  {
    id: "u2_ruffini_signo_a",
    unit: 2,
    description:
      "Error al aplicar el teorema del resto o Ruffini: evalúa P(a) en lugar de P(−a) cuando el divisor es (x − a), o viceversa. La regla de Ruffini para dividir por (x − a) usa a como raíz de prueba; para (x + a) se usa −a. Confundir el signo produce cociente y resto incorrectos.",
    examples: [
      "Para P(x) = x³ − 2x + 1 dividido por (x − 2), evaluar P(−2) = −3 en vez de P(2) = 5 (el divisor es x−2, se evalúa en a=2)",
      "Para P(x) = 2x² + 3x − 1 dividido por (x + 1), usar a = 1 en Ruffini en vez de a = −1",
    ],
  },
  {
    id: "u2_grado_incorrecto",
    unit: 2,
    description:
      "Error al determinar el grado de un polinomio: confunde el grado (máximo exponente con coeficiente no nulo) con el número de términos, o asigna un grado incorrecto al resultado de una operación entre polinomios.",
    examples: [
      "Decir que el grado de 3x⁴ + 2x² − 1 es 3 (número de términos) en vez de 4 (máximo exponente)",
      "Afirmar que (x² + 1)(x³ − 2) tiene grado 5 (correcto: 2+3=5 por producto de potencias) pero un alumno dice grado 3 (confunde con el término mayor visible)",
    ],
  },
  {
    id: "u2_termino_faltante",
    unit: 2,
    description:
      "Error al completar un polinomio con coeficientes cero para grados intermedios faltantes. Al operar (especialmente en Ruffini o división), se deben incluir todos los grados desde el máximo hasta el término constante, escribiendo coeficiente 0 para los grados que no aparecen explícitamente.",
    examples: [
      "Dividir x³ − 1 por (x − 1) usando Ruffini sin escribir el coeficiente 0 para x² y x: [1, 0, 0, −1] en vez de escribir solo [1, −1]",
      "Calcular mal el grado de 0x³ + 2x² − 5 (el término 0x³ no cuenta; el grado real es 2)",
    ],
  },
  {
    id: "u2_factorizacion_incompleta",
    unit: 2,
    description:
      "Error al factorizar un polinomio: extrae un factor común pero no continúa hasta la factorización completa, o deja una expresión que todavía puede factorearse (diferencia de cuadrados, trinomio cuadrado perfecto, etc.). La factorización debe continuar hasta que ningún factor pueda descomponerse más en el conjunto de los enteros.",
    examples: [
      "Factorizar x³ − x como x(x² − 1) sin continuar: x² − 1 = (x−1)(x+1), la factorización completa es x(x−1)(x+1)",
      "Factorizar 2x² − 8 como 2(x² − 4) sin reconocer que x² − 4 = (x−2)(x+2)",
    ],
  },
  {
    id: "u2_signo_factorizacion",
    unit: 2,
    description:
      "Error al factorizar: pierde o cambia el signo en uno o más factores. El alumno elige factores con el valor absoluto correcto pero con signos opuestos en al menos uno de ellos, como repetir el mismo factor con el mismo signo cuando deberían ser conjugados para una diferencia de cuadrados.",
    examples: [
      "Factorizar x² − 9 como (x−3)(x−3) en vez de (x−3)(x+3) (signo perdido en el segundo factor)",
      "Factorizar x² − 4 como (x−2)(x−2) en vez de (x−2)(x+2) (signo perdido en el segundo factor)",
    ],
  },
  {
    id: "u2_caso_incorrecto",
    unit: 2,
    description:
      "Error al identificar el caso de factoreo aplicable. El alumno aplica un caso de factoreo que no corresponde al polinomio dado, como usar factor común donde se necesita diferencia de cuadrados, o intentar trinomio cuadrado perfecto con un binomio.",
    examples: [
      "Aplicar factor común donde corresponde diferencia de cuadrados. Ejemplo: x² − 25 tratado como x(x − 25/x) en vez de (x−5)(x+5)",
      "Tratar un binomio de la forma x² + 1 como si fuera una diferencia de cuadrados (no se puede factorear en ℝ)",
      "Intentar trinomio cuadrado perfecto con un trinomio que no tiene la forma a² + 2ab + b²",
    ],
  },

  // Unit 3: Ecuaciones y sistemas — error tags backed by the Unit 3 SDD sequence.
  // First-implementation scope: 8 tags, one per U3 skill (per spec U3-TAG-001).
  // PR 1 of fortalecer-u3-lenguaje-modelizacion-transferencia adds
  // `u3_traduccion_incorrecta` to cover the new translation leaf skill
  // (`mat.u3.traduccion_lenguaje_verbal`). It is a U3 tag because the
  // modeling chain lives in Unit 3.
  {
    id: "u3_traduccion_incorrecta",
    unit: 3,
    description:
      "Error al traducir el enunciado a lenguaje algebraico: confunde la cantidad que representa la incógnita, invierte la relación descrita (suma por resta, producto por cociente), o asigna la expresión a la variable equivocada.",
    examples: [
      "Modelar \"el doble de un número menos 3 es 15\" como 2x - 3 = 15 (correcto) vs. 2x + 3 = 15 (signo invertido)",
      "Modelar \"la suma de tres números consecutivos es 36\" como x + (x+1) + (x+2) = 36 (correcto) vs. x + x + x = 36 (olvida el consecutivo)",
      "Elegir como incógnita la cantidad PEDIDA en vez de la cantidad BASE del enunciado, o viceversa",
    ],
  },
  {
    id: "u3_verificacion_omitida",
    unit: 3,
    description:
      "Error al cerrar un problema modelizado: resuelve o plantea la ecuación pero omite verificar la solución en el enunciado original, sus unidades y sus restricciones contextuales.",
    examples: [
      "Dar solo x = 5 para un rectángulo sin comprobar que 2(5 + 10) = 30",
      "Resolver un problema de edades futuras y verificar la suma actual en lugar de la suma dentro de 5 años",
    ],
  },
  {
    id: "u3_interpretacion_contextual_incorrecta",
    unit: 3,
    description:
      "Error al interpretar la solución: entrega el valor algebraico sin decir qué representa en el contexto, o responde una magnitud distinta de la pedida por el enunciado.",
    examples: [
      "Responder x = 5 cuando la pregunta pide las dimensiones del rectángulo: 5 cm y 10 cm",
      "Responder las edades futuras cuando el enunciado pregunta por las edades actuales",
    ],
  },
  {
    id: "u3_aislamiento_incorrecto",
    unit: 3,
    description:
      "Error al aislar la variable: aplica operaciones inversas en orden incorrecto, o pierde un signo al mover un término entre lados de la ecuación lineal.",
    examples: [
      "Resolver 2x + 5 = 13 como x = 13 - 5 (pierde el coeficiente 2) en vez de x = (13 - 5) / 2 = 4",
      "En 3x = 7 - x, escribir 3x = 7 (pierde el -x del lado derecho) en vez de 4x = 7",
    ],
  },
  {
    id: "u3_factorizacion_cuadratica",
    unit: 3,
    description:
      "Error al factorizar la cuadrática para encontrar las raíces: factoriza con un signo invertido, pierde una raíz, u omite el término independiente en el producto de binomios.",
    examples: [
      "Resolver x² - 5x + 6 = 0 como (x - 1)(x - 6) = 0 (signos cruzados invertidos) en vez de (x - 2)(x - 3) = 0",
      "Decir que x² = 9 tiene una sola raíz x = 3 (omisión de la raíz negativa)",
    ],
  },
  {
    id: "u3_signo_desigualdad",
    unit: 3,
    description:
      "Error al multiplicar o dividir por un número negativo: olvida invertir el sentido de la desigualdad lineal.",
    examples: [
      "-2x > 4 → x > -2 en vez de x < -2",
      "(-3)x ≤ 9 → x ≤ -3 en vez de x ≥ -3",
    ],
  },
  {
    id: "u3_dos_valores_absoluto",
    unit: 3,
    description:
      "Error al resolver inecuaciones con valor absoluto: trata |ax + b| < c como una única solución lineal, sin descomponer en la conjunción (caso <) o disyunción (caso >) correspondiente.",
    examples: [
      "Resolver |x - 2| < 5 como x - 2 < 5 → x < 7 (omite la otra mitad -x + 2 < 5 → x > -3)",
      "Resolver |2x + 1| ≥ 3 como 2x + 1 ≥ 3 → x ≥ 1 (omite la rama 2x + 1 ≤ -3 → x ≤ -2)",
    ],
  },
  {
    id: "u3_pendiente_o_ordenada",
    unit: 3,
    description:
      "Error al trabajar con la ecuación de la recta: confunde la pendiente con la ordenada al origen, intercambia coordenadas al calcular la pendiente, o confunde pendiente con dirección de la recta.",
    examples: [
      "Dados (1, 2) y (3, 6), calcular la pendiente como (3 - 1) / (6 - 2) = 1/2 en vez de (6 - 2) / (3 - 1) = 2",
      "Escribir y = 3x + 2 como pendiente 2 y ordenada 3 (intercambia los coeficientes)",
    ],
  },
  {
    id: "u3_sustitucion_o_eliminacion",
    unit: 3,
    description:
      "Error al resolver sistemas de ecuaciones por sustitución o eliminación: pierde un término al sustituir, sustituye en la ecuación equivocada, o suma/resta con el signo invertido al eliminar.",
    examples: [
      "En x + y = 5 y 2x - y = 1, sumar las ecuaciones como x + y + 2x + y = 6 (no cambia el signo de -y) en vez de x + y + 2x - y = 6 → 3x = 6",
      "Sustituir x = 5 - y en 2x - y = 1 como 2(5 - y) = 1 (no sustituye en la segunda ecuación completa) en vez de 2(5 - y) - y = 1 → 10 - 3y = 1 → y = 3",
    ],
  },
  {
    id: "u3_igualdad_exponenciales",
    unit: 3,
    description:
      "Error al resolver ecuaciones exponenciales: trata bases distintas como si fueran iguales sin unificarlas, o no iguala los exponentes después de llevar a la misma base.",
    examples: [
      "Resolver 2^x = 8 como x = 8 (trata 2 y 8 como la misma base) en vez de x = 3",
      "En 4^x = 32, escribir 4^x = 2^x (sin unificar a la misma base 2) en vez de (2²)^x = 2^5 → 2x = 5 → x = 5/2",
    ],
  },
  {
    id: "u3_propiedad_logaritmo",
    unit: 3,
    description:
      "Error al aplicar propiedades de logaritmos: confunde log(a + b) con log a + log b, usa cambio de base mal, o pierde un coeficiente al sacar el exponente.",
    examples: [
      "Simplificar log(a · b) como log a · log b en vez de log a + log b",
      "Aplicar log(a^n) como (log a)^n en vez de n · log a",
    ],
  },

  // Legacy U3 tag — pre-existed before the SDD Unit 3 activation.
  // Kept for backward compatibility with any existing content that
  // references it. Not part of the U3 first-sprint detector set.
  {
    id: "u3_direccion_desigualdad",
    unit: 3,
    description:
      "Error al interpretar el sentido de la desigualdad: confunde mayor con menor.",
    examples: [
      "Interpretar x > 3 como valores menores que 3",
      "Graficar x ≤ -2 como círculo abierto en -2 y sombra a la derecha",
    ],
  },

  // Unit 4: Geometry and measures
  {
    id: "u4_formula_area",
    unit: 4,
    description:
      "Error al aplicar fórmula de área: usa fórmula incorrecta o aplica dimensiones equivocadas.",
    examples: [
      "Calcular área de rectángulo como base × altura × 2",
      "Usar fórmula de área de triángulo para un rectángulo",
    ],
  },
  {
    id: "u4_suma_angulos",
    unit: 4,
    description:
      "Error en suma de ángulos: olvida que la suma de ángulos internos de un triángulo es 180°.",
    examples: [
      "Decir que los ángulos de un triángulo suman 360°",
      "Calcular un ángulo faltante sumando 90° en vez de 180° - (a + b)",
    ],
  },

  // Unit 5: Trigonometry
  {
    id: "u5_cuadrante_angulo",
    unit: 5,
    description:
      "Error al ubicar un ángulo en la circunferencia trigonométrica: confunde cuadrantes o sentido de giro.",
    examples: [
      "Ubicar 300° en el primer cuadrante en vez del cuarto",
      "Leer 210° como si estuviera entre 0° y 90°",
    ],
  },
  {
    id: "u5_identidad_pitagorica",
    unit: 5,
    description:
      "Error al aplicar identidades trigonométricas básicas: reemplaza sen²(θ)+cos²(θ) por una expresión no equivalente.",
    examples: [
      "Escribir sen²(θ)+cos²(θ)=2 en vez de 1",
      "Tratar sen²(θ)+cos²(θ) como (sen(θ)+cos(θ))²",
    ],
  },

  // Unit 6: Functions
  {
    id: "u6_dominio_funcion",
    unit: 6,
    description:
      "Error al determinar el dominio: olvida restricciones como división por cero o raíz de negativo.",
    examples: [
      "Decir que el dominio de f(x)=1/x son todos los reales",
      "Incluir -5 en el dominio de f(x)=√(x+4)",
    ],
  },
  {
    id: "u6_rango_funcion",
    unit: 6,
    description:
      "Error al determinar el rango: confunde valores posibles de salida con valores de entrada.",
    examples: [
      "Decir que el rango de f(x)=x² son todos los reales",
      "Olvidar que f(x)=1/x no puede ser 0",
    ],
  },
] as const;

/**
 * Load the complete error taxonomy.
 * Validates coverage (≥2 tags/unit) and uniqueness.
 * @returns Array of ErrorTag objects
 * @throws Error if taxonomy is invalid
 */
export function loadTaxonomy(): ErrorTag[] {
  // Validate uniqueness
  const ids = TAXONOMY.map((t) => t.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    throw new Error(`Duplicate error tag IDs: ${[...new Set(duplicates)].join(", ")}`);
  }

  // Validate coverage per unit
  for (let unit = 1; unit <= 6; unit++) {
    const unitTags = TAXONOMY.filter((t) => t.unit === unit);
    if (unitTags.length < 2) {
      throw new Error(`Unit ${unit} has only ${unitTags.length} error tags; requires at least 2`);
    }
  }

  return [...TAXONOMY]; // return mutable copy
}

/**
 * Look up an error tag by its ID.
 * @param tagId - The error tag ID to find
 * @returns The matching ErrorTag, or undefined if not found
 */
export function lookupTag(tagId: string): ErrorTag | undefined {
  return TAXONOMY.find((t) => t.id === tagId);
}

/**
 * Filter error tags by unit number.
 * @param unit - Unit number (1-6)
 * @returns Array of ErrorTag objects for that unit
 */
export function filterByUnit(unit: number): ErrorTag[] {
  return TAXONOMY.filter((t) => t.unit === unit);
}
