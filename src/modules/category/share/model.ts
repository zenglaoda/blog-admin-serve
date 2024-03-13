export class CategoryModel {
  id: number;
  // 父级 id 等于 0
  pid: number;
  // 当前分类同一层级的下一个兄弟分类
  next_id: number;

  title: string;

  description: string;

  c_time: number;

  m_time: number;
}
