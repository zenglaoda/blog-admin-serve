import { ResultSetHeader, escape } from 'mysql2';
import { Injectable } from '@nestjs/common';
import { MysqlService } from '@/provider/mysql.service';
import { CreateDto, MoveDto, UpdateCto } from './share/dto';

import type { RowDataPacket, Connection } from 'mysql2/promise';
import { Category } from './share/model';

interface CategoryTree extends Category {
  children: CategoryTree[];
}

type RemoveInterceptor = (id: number) => Promise<any>;

@Injectable()
export class CategoryService {
  private categoryTree: CategoryTree[];
  private categoryMap: Map<number, CategoryTree> = new Map();
  private isStale = true;
  private removeInterceptors: RemoveInterceptor[];

  constructor(private readonly mysqlService: MysqlService) {}

  private isValidId(id: number) {
    return id === 0 || this.categoryMap.has(id);
  }

  private getPrevCategory(id: number) {
    const category = this.categoryMap.get(id);
    let categories: CategoryTree[];
    if (category.pid === 0) {
      categories = this.categoryTree;
    } else {
      categories = this.categoryMap.get(category.pid).children;
    }
    return categories.find((e) => e.next_id === id);
  }

  private markStale() {
    this.isStale = true;
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

  private async syncCategories(connection: Connection) {
    if (this.isStale) {
      const [results] = await connection.query<RowDataPacket[]>(`
        SELECT id, pid, next_id, title, description FROM category;
      `);
      const categories = results as CategoryTree[];
      categories.forEach((e) => {
        this.categoryMap.set(e.id, e);
      });
      this.combineCategoryTree();
      this.isStale = false;
    }
  }

  async getList() {
    const connection = await this.mysqlService.getConnection();
    try {
      await this.syncCategories(connection);
    } finally {
      this.mysqlService.release(connection);
    }
    return this.categoryTree;
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
    let insertId: number;
    const connection = await this.mysqlService.getConnection();
    try {
      await this.syncCategories(connection);

      createDto.pid = createDto.pid || 0;
      createDto.nextId = createDto.nextId || 0;

      if (!this.isValidId(createDto.pid)) {
        throw new Error('不存在的 pid');
      }
      if (!this.isValidId(createDto.nextId)) {
        throw new Error('不存在的 nextId');
      }
      const nextCategory = this.categoryMap.get(createDto.nextId);
      if (nextCategory.pid !== createDto.pid) {
        throw new Error('nextId 与 pid 不匹配');
      }

      await connection.beginTransaction();
      try {
        const [results] = await connection.query<ResultSetHeader>(
          `INSERT INTO category 
            (pid, next_id, title, description) 
          VALUES
            (?, ?, ?, ?);
          `,
          [
            createDto.pid,
            createDto.nextId,
            createDto.title,
            createDto.description,
          ],
        );
        insertId = results.insertId;
        const prevCategory = this.getPrevCategory(createDto.nextId);
        if (prevCategory) {
          await connection.query(
            `UPDATE category SET next_id = ? WHERE id = ?`,
            [insertId, prevCategory.id],
          );
        }
        await connection.commit();
        this.markStale();
      } catch (err) {
        await connection.rollback();
        throw err;
      }
    } finally {
      this.mysqlService.release(connection);
    }
    return insertId;
  }

  async addRemoveInterceptor(fn: RemoveInterceptor) {
    this.removeInterceptors.push(fn);
  }

  async delRemoveInterceptor(fn: RemoveInterceptor) {
    this.removeInterceptors = this.removeInterceptors.filter((f) => f !== fn);
  }

  async remove(id: number) {
    await Promise.all(this.removeInterceptors.map((fn) => fn(id)));
    const connection = await this.mysqlService.getConnection();
    try {
      await this.syncCategories(connection);
      const category = this.categoryMap.get(id);
      if (category.children.length > 0) {
        throw new Error('删除失败，当前分类下存在子分类');
      }

      await connection.beginTransaction();
      try {
        await connection.query<RowDataPacket[]>(
          `DELETE FROM category WHERE id = ?`,
          [id],
        );
        const prevCategory = this.getPrevCategory(id);
        const category = this.categoryMap.get(id);
        if (prevCategory) {
          await connection.query<RowDataPacket[]>(
            `UPDATE category SET next_id = ? WHERE id = ?`,
            [category.next_id, prevCategory.id],
          );
        }
        await connection.commit();
        this.markStale();
      } catch (err) {
        await connection.rollback();
        throw err;
      }
    } finally {
      this.mysqlService.release(connection);
    }
  }

  async update(updateDto: UpdateCto) {
    const connection = await this.mysqlService.getConnection();
    try {
      await connection.query<ResultSetHeader>(
        `UPDATE category SET
          title = ${escape(updateDto.title)},
          description = ${escape(updateDto.description)},
        WHERE
          id = ${escape(updateDto.id)};
        `,
      );
      this.markStale();
    } finally {
      this.mysqlService.release(connection);
    }
  }

  async move(moveDto: MoveDto) {
    const connection = await this.mysqlService.getConnection();
    await connection.beginTransaction();
    try {
      await this.mv(connection, moveDto);
      await connection.commit();
      this.markStale();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      this.mysqlService.release(connection);
    }
  }

  /**
   * 移动分类
   * 1. 跨父级移动，需要变动两颗子树
   * 2. 同父级内移动，只需要变动一颗子树
   * @param connection
   * @param moveDto
   */
  private async mv(connection: Connection, moveDto: MoveDto) {
    await this.syncCategories(connection);
    const category = this.categoryMap.get(moveDto.id);
    let prevCategory = this.getPrevCategory(moveDto.id);
    if (prevCategory) {
      await connection.query(`UPDATE category SET next_id = ? WHERE id = ?`, [
        category.next_id,
        prevCategory.id,
      ]);
    }

    prevCategory = this.getPrevCategory(moveDto.nextId);
    if (prevCategory) {
      await connection.query(`UPDATE category SET next_id = ? WHERE id = ?`, [
        moveDto.id,
        prevCategory.id,
      ]);
    }

    await connection.query(
      `UPDATE category SET pid = ?, next_id = ? WHERE id = ?`,
      [moveDto.pid, moveDto.nextId, moveDto.id],
    );
  }

  async retrieve() {}
}
