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

/**
 * 获取分页查询索引
 * @param dto
 * @returns
 */
export function paging(dto: { page: number; pageSize: number }) {
  const { page, pageSize } = dto;
  return [(page - 1) * pageSize, page * pageSize];
}
