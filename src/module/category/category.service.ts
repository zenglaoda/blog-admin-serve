import { ResultSetHeader, escape } from 'mysql2';
import { Injectable } from '@nestjs/common';
import { MysqlService } from '@/provider/mysql.service';
import { CreateDto, UpdateCto } from './share/dto';

import type { RowDataPacket } from 'mysql2';
import type { Category } from './share/model';

interface CategoryTree extends Category {
  children: CategoryTree[];
}

@Injectable()
export class CategoryService {
  private categoryTree: CategoryTree[];
  private categoryMap: Map<number, Category> = new Map();
  private isStale = true;

  constructor(private readonly mysqlService: MysqlService) {}

  async combineCategoryTree() {
    const isRoot = (category: Category) => category.pid === 0;
    const isLast = (category: Category) => category.next_id === 0;
    const categories = [...this.categoryMap.values()] as CategoryTree[];

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (!isRoot(category)) {
        const parent = this.categoryMap.get(category.pid) as CategoryTree;
        parent.children = parent.children || [];
        parent.children.push(category);
      }
    }
    const rootCategories = categories.filter((category) => isRoot(category));

    const recurse = (categories: CategoryTree[]) => {
      const children: CategoryTree[] = [];
      let lastChild = categories.find((child) => isLast(child));
      while (lastChild) {
        lastChild.children = recurse(lastChild.children);
        children.push(lastChild);
        lastChild = this.categoryMap.get(lastChild.pid) as CategoryTree;
      }
      return children.reverse();
    };
    this.categoryTree = recurse(rootCategories);
  }

  async pullList() {
    if (this.isStale) {
      const connection = await this.mysqlService.getConnection();
      const [results] = await connection.query<RowDataPacket[]>(`
        SELECT id, pid, next_id, title, description FROM category;
      `);
      this.mysqlService.release(connection);
      const categories = results as Category[];
      categories.forEach((item) => {
        this.categoryMap.set(item.id, item);
      });
      this.combineCategoryTree();
      this.isStale = false;
    }
  }


  async getList() {
    await this.pullList();
    return this.categoryTree;
  }

  private isValidId(id: number) {
    return id === 0 || this.categoryMap.has(id);
  }

  /**
   * 获取当前同一层级最后一个分类
   * @param id
   */
  private findLast(id: number) {
    
  }

  /**
   * TODO: 确保 pid,next_id 存在且合理
   * 1. pid 需要存在
   * 2. next_id 需要存在
   * 创建分类
   * @param createDto
   * @returns 自动增长的 id
   */
  async create(createDto: CreateDto) {
    createDto.pid = createDto.pid || 0;
    createDto.nextId = createDto.nextId || 0;

    if (!this.isValidId(createDto.pid)) {
      throw new Error('不存在的 pid');
    }
    if (!this.isValidId(createDto.nextId)) {
      throw new Error('不存在的 nextId');
    }


    const connection = await this.mysqlService.getConnection();
    const [results] = await connection.query<ResultSetHeader>(
      `INSERT INTO category 
        (pid, next_id, title, description) 
      VALUES
        (?, ?, ?, ?);
      `,
      [
        createDto.pid || 0,
        createDto.nextId || 0,
        createDto.title,
        createDto.description,
      ],
    );
    this.mysqlService.release(connection);
    this.isStale = true;
    return results.insertId;
  }

  async remove() {}

  async update(updateDto: UpdateCto) {
    const connection = await this.mysqlService.getConnection();
    const [results] = await connection.query<ResultSetHeader>(
      `UPDATE category SET
        pid = ${escape(updateDto.pid || 0)},
        next_id = ${escape(updateDto.nextId || 0)},
        title = ${escape(updateDto.title)},
        description = ${escape(updateDto.description)},
      WHERE
        id = ${escape(updateDto.id)};
      `,
    );
    this.mysqlService.release(connection);
    this.isStale = true;
    return results.insertId;
  }

  async move() {}

  async retrieve() {}
}
