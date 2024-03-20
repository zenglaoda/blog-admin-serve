import { Injectable } from '@nestjs/common';
import { Observer } from '@/utils/observer';

import { Category } from './share/model';
import { MysqlService } from '@/provider/mysql.service';
import type { RowDataPacket } from 'mysql2/promise';

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

@Injectable()
export class CategoryStore extends Observer<string> {
  categoryTree: CategoryTree[] = [];
  categoryMap: Map<number, CategoryTree> = new Map();
  private isStale = true;

  constructor(private readonly mysqlService: MysqlService) {
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

  markStale() {
    this.isStale = true;
  }

  /**
   * 拉取最新分类数据
   */
  private async pullList() {
    if (this.isStale) {
      let categories: CategoryTree[] = [];
      const connection = await this.mysqlService.getConnection();
      try {
        const [results] = await connection.query<RowDataPacket[]>(`
          SELECT id, pid, next_id, title, description FROM category;
        `);
        categories = results as CategoryTree[];
      } finally {
        this.mysqlService.release(connection);
      }
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
          if (visited.has(category)) break;
          list.push(category);
          visited.add(category);
          category = this.categoryMap.get(category.next_id);
        }
        linkList = list.concat(linkList);
        if (linkList.length === children.length) break;
      }
      return linkList;
    };

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      category.children = combine(category.children);
    }
    return rootCategories;
  }

  isRootCategory(category: Category) {
    return category.pid === 0;
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

/**
 * 获取最新分类数据装饰器，依赖实例的 categoryStore 属性
 * @param target
 * @param key
 * @param descriptor
 */
export function syncCatStore() {
  return function (target: any, key: string, descriptor: any) {
    const original = descriptor.value;
    descriptor.value = async function (...args) {
      await this.categoryStore.pullList();
      const result = original.call(this, ...args);
      return result;
    };
  };
}
