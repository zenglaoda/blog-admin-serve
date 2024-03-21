/**
 * 去除值为 null, undefined 的键
 * @param obj
 */
export function discardUndef(obj: object) {
  return Object.keys(obj).reduce((data, key) => {
    const value = obj[key];
    if (value !== null && value !== undefined) data[key] = value;
    return data;
  }, {});
}
