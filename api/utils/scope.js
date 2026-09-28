/**
 * api/utils/scope.js - Property scoping helper
 * Works with getAccessiblePropertyIds(req) which returns ['*'] for admin or [uuid,...] for scoped users
 */

/**
 * Build SQL filter clause for property scoping
 * @param {string[]|string} scope - array of property UUIDs or ['*'] or '*' string
 * @param {string} columnRef - e.g. 'r.property_id', 'p.id', 't.property_id', etc.
 * @param {number} paramOffset - current number of params already used (so $N is correct)
 * @returns {{ clause: string, params: any[], nextIndex: number }}
 * 
 * Usage:
 *   const baseParams = [status];
 *   const { clause, params: scopeParams, nextIndex } = buildPropertyFilter(propertyIds, 'rooms.property_id', baseParams.length);
 *   // clause = " AND rooms.property_id = ANY($2)" or "" for admin
 *   // final query: `WHERE ... ${clause}` with [...baseParams, ...scopeParams]
 */
function buildPropertyFilter(scope, columnRef, paramOffset = 0) {
  if (!scope) return { clause: '', params: [], nextIndex: paramOffset + 1 };
  // Admin bypass
  if (scope === '*' || (Array.isArray(scope) && scope.includes('*'))) {
    return { clause: '', params: [], nextIndex: paramOffset + 1 };
  }
  if (!Array.isArray(scope) || scope.length === 0) {
    // No access -> force empty result
    return { clause: ` AND 1=0 /* no property access */`, params: [], nextIndex: paramOffset + 1 };
  }

  const idx = paramOffset + 1;
  return {
    clause: ` AND ${columnRef} = ANY($${idx})`,
    params: [scope],
    nextIndex: idx + 1
  };
}

/**
 * Helper to build WHERE clause start
 * Returns "WHERE 1=1" if you already have conditions using AND
 */
function whereAnd(clause) {
  return clause || '';
}

module.exports = {
  buildPropertyFilter,
  whereAnd
};
