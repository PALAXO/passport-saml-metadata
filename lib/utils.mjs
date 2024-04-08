

/**
 * Check if given value is array and if not, converts it to array
 *
 * @param {T} value
 * @returns {Array<T>}
 */
export const castArray = (value) => Array.isArray(value) ? value : [value];
