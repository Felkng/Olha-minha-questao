/**
 * Converte um numeral romano válido (I, II, III, IV, X, etc.) para número inteiro.
 * Retorna null caso a string não seja um numeral romano válido.
 */
export function romanToInt(s?: string | null): number | null {
  const upper = (s || '').trim().toUpperCase();
  if (!upper || !/^(M{0,3})(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(upper)) {
    return null;
  }
  const romanMap: { [key: string]: number } = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  let total = 0;
  let prevValue = 0;
  for (let i = upper.length - 1; i >= 0; i--) {
    const current = romanMap[upper[i]];
    if (!current) return null;
    if (current < prevValue) {
      total -= current;
    } else {
      total += current;
      prevValue = current;
    }
  }
  return total > 0 ? total : null;
}

/**
 * Comparador natural para identificadores de questões (números, números romanos, letras ou texto com números).
 * Ex: 1, 2, 3 ... 9, 10, 11; I, II, III, IV, X; Questão 1, Questão 10.
 */
export function compareQuestionIdentifiers(a?: string | null, b?: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const aStr = String(a).trim();
  const bStr = String(b).trim();

  if (aStr.toLowerCase() === bStr.toLowerCase()) return 0;

  // Verifica se ambos são números romanos
  const rA = romanToInt(aStr);
  const rB = romanToInt(bStr);
  if (rA !== null && rB !== null) {
    return rA - rB;
  }

  // Ordenação natural padrão em pt-BR (reconhece números dentro de strings sem colapsar 10 antes de 2)
  return aStr.localeCompare(bStr, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

/**
 * Ordena uma lista de questões pelo identificador utilizando ordenação natural.
 */
export function sortQuestionsByIdentifier<T extends { identifier?: string | null }>(questions: T[]): T[] {
  return [...questions].sort((a, b) => compareQuestionIdentifiers(a.identifier, b.identifier));
}
