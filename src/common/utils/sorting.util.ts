/**
 * Utilitário para ordenação de resultados do catálogo
 */

export type SortDirection = 'asc' | 'desc';

/**
 * Acessa valor de campo aninhado usando dot notation
 * Ex: getNestedValue(obj, 'rating.average') retorna obj.rating.average
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Compara dois valores considerando null/undefined
 * @returns número negativo se a < b, positivo se a > b, 0 se iguais
 */
function compareValues(a: any, b: any, direction: SortDirection): number {
  // Trata null/undefined como menor valor
  if (a == null && b == null) return 0;
  if (a == null) return direction === 'desc' ? 1 : -1;
  if (b == null) return direction === 'desc' ? -1 : 1;

  // Comparação para datas
  if (a instanceof Date && b instanceof Date) {
    const diff = a.getTime() - b.getTime();
    return direction === 'desc' ? -diff : diff;
  }

  // Comparação numérica/string
  if (a === b) return 0;
  const comparison = a > b ? 1 : -1;
  return direction === 'desc' ? -comparison : comparison;
}

/**
 * Ordena itens do catálogo por múltiplos critérios:
 * 1. matchCount (descendente) - prioriza ONGs com mais categorias correspondentes
 * 2. orderByField (conforme direction) - critério específico da seção (suporta dot notation)
 * 3. id (ascendente) - tie-breaker determinístico
 */
export function sortCatalogItems<T extends { matchCount: number; id: number; [key: string]: any }>(
  items: T[],
  orderByField: string,
  orderByDirection: SortDirection,
): T[] {
  return items.sort((a, b) => {
    // Critério 1: Quantidade de match de categorias (sempre descendente)
    if (a.matchCount !== b.matchCount) {
      return b.matchCount - a.matchCount;
    }

    // Critério 2: Campo específico da seção (suporta paths aninhados como 'rating.average')
    const aValue = getNestedValue(a, orderByField);
    const bValue = getNestedValue(b, orderByField);
    const fieldComparison = compareValues(aValue, bValue, orderByDirection);
    if (fieldComparison !== 0) {
      return fieldComparison;
    }

    // Critério 3: id como tie-breaker (sempre ascendente)
    return a.id - b.id;
  });
}
