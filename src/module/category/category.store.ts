import type { Category } from './share/model';

interface CategoryTree extends Category {
  children: CategoryTree[];
}

export class CategoryStore {
  constructor() {}

  isRootCategory(category: Category) {
    return category.pid === 0;
  }

  private async combineCategoryTree() {
    const isRoot = (category: Category) => category.pid === 0;
    const categories = [...this.categoryMap.values()];
    const rootCategories: CategoryTree[] = [];

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (isRoot(category)) {
        rootCategories.push(category);
      } else {
        const parent = this.categoryMap.get(category.pid);
        parent.children = parent.children || [];
        parent.children.push(category);
      }
    }

    const combine = (children: CategoryTree[]) => {
      const visited = new Set<CategoryTree>();
      let linkList: CategoryTree[] = [];
      for (let i = 0; i < children.length; i++) {
        let category = children[i];
        const list: CategoryTree[] = [];
        while (category) {
          if (visited.has(category)) {
            linkList = list.concat(linkList);
            break;
          }
          list.push(category);
          visited.add(category);
          category = this.categoryMap.get(category.next_id);
        }
        if (list.length === children.length) break;
      }
      return linkList;
    };

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      category.children = combine(category.children);
    }
    this.categoryTree = rootCategories;
  }

  /**
   * 获取指定分类的上一个兄弟分类
   * @param id 分类id
   * @param pid 父分类id
   * @returns
   */
  private getPrevCategory(id: number, pid?: number): CategoryTree | undefined {
    let categories: CategoryTree[];
    const category = this.categoryMap.get(id);

    if (this.categoryMap.size === 0) {
      return;
    } else if (id === 0) {
      if (typeof pid !== 'number') {
        throw new Error('if id is 0, the pid is required');
      }
      categories = this.categoryMap.get(pid).children;
    } else if (this.isRootCategory(category)) {
      categories = this.categoryTree;
    } else {
      categories = this.categoryMap.get(category.pid).children;
    }
    return categories.find((e) => e.next_id === id);
  }
}
