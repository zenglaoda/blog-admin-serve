import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Observer } from '@/utils/observer';

import { Category } from './share/model';
import { CategoryService } from './category.service';

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

@Injectable()
export class CategoryStore extends Observer<string> {
  categoryTree: CategoryTree[] = [];
  categoryMap: Map<number, CategoryTree> = new Map();
  private isStale = true;

  constructor(
    @Inject(forwardRef(() => CategoryService))
    private readonly categoryService: CategoryService,
  ) {
    super();
  }

  /**
   * @override
   * @param key
   * @param args
   */
  async notify(key: string, ...args: any[]): Promise<any> {
    const subscribers = this.subjects.get(key) || [];
    for (let i = 0; i < subscribers.length; i++) {
      const callback = subscribers[i];
      await callback(...args);
    }
  }

  private async pullList() {
    if (this.isStale) {
      const categories =
        (await this.categoryService.pullList()) as CategoryTree[];
      categories.forEach((e) => {
        e.children = [];
        this.categoryMap.set(e.id, e);
      });
      this.categoryTree = this.combineCategoryTree(categories);
      this.isStale = false;
    }
  }

  private combineCategoryTree(categories: CategoryTree[]) {
    const rootCategories: CategoryTree[] = [];

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (this.isRootCategory(category)) {
        rootCategories.push(category);
      } else {
        const parent = this.categoryMap.get(category.pid);
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
      const category = categories[i] as CategoryTree;
      category.children = combine(category.children);
    }
    return rootCategories;
  }

  isRootCategory(category: Category) {
    return category.pid === 0;
  }

  markStale() {
    this.isStale = true;
  }

  /**
   * 获取指定分类的上一个兄弟分类
   * @param id 分类id
   * @param pid 父分类id
   * @returns
   */
  getPrevCategory(id: number, pid?: number): CategoryTree | undefined {
    let categories: CategoryTree[];
    const category = this.categoryMap.get(id);

    if (this.categoryMap.size === 0) {
      return;
    } else if (id === 0) {
      if (typeof pid !== 'number') {
        throw new Error('if id is 0, the pid is required');
      }
      if (pid === 0) {
        categories = this.categoryTree;
      } else {
        categories = this.categoryMap.get(pid).children;
      }
    } else if (this.isRootCategory(category)) {
      categories = this.categoryTree;
    } else {
      categories = this.categoryMap.get(category.pid).children;
    }
    return categories.find((e) => e.next_id === id);
  }

  async getCategoryMap() {
    await this.pullList();
    return this.categoryMap;
  }

  async getCategoryTree() {
    await this.pullList();
    return this.categoryTree;
  }
}

export function syncCatStore(target: any, key: string, descriptor: any) {
  const original = descriptor.value;
  descriptor.value = async function (...args) {
    await this.categoryStore.pullList();
    const result = original.call(this, ...args);
    return result;
  };
}
