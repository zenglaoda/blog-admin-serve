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
  private categoryTree: CategoryTree[] = [];
  private categoryMap: Map<number, CategoryTree> = new Map();
  private removeInterceptors: RemoveInterceptor[];
  private isStale = true;

  constructor(private readonly mysqlService: MysqlService) {}

  // is root
  private isRootCategory(category: Category) {
    return category.pid === 0;
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

  private async syncCategories(connection?: Connection) {
    if (this.isStale) {
      let shouldRelease = false;
      if (!connection) {
        connection = await this.mysqlService.getConnection();
        shouldRelease = true;
      }
      try {
        const [results] = await connection.query<RowDataPacket[]>(`
          SELECT id, pid, next_id, title, description FROM category;
        `);
        const categories = results as CategoryTree[];
        categories.forEach((e) => {
          this.categoryMap.set(e.id, e);
        });
        this.combineCategoryTree();
        this.isStale = false;
      } finally {
        if (shouldRelease) {
          this.mysqlService.release(connection);
        }
      }
    }
  }

  async getList() {
    await this.syncCategories();
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

      const isValidId = (id: number) => id === 0 || this.categoryMap.has(id);

      if (!isValidId(createDto.pid)) {
        throw new Error('不存在的 pid');
      }
      if (!isValidId(createDto.nextId)) {
        throw new Error('不存在的 nextId');
      }
      const nextCategory = this.categoryMap.get(createDto.nextId);
      if (createDto.nextId !== 0 && nextCategory.pid !== createDto.pid) {
        throw new Error('netId 与 pid 不匹配');
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
        const prevCategory = this.getPrevCategory(
          createDto.nextId,
          createDto.pid,
        );
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
    moveDto.pid = moveDto.pid || 0;
    moveDto.nextId = moveDto.nextId || 0;

    const connection = await this.mysqlService.getConnection();
    await this.syncCategories(connection);
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

  async retrieve(id: number) {
    await this.syncCategories();
    const category = this.categoryMap.get(id);
    if (!category) return null;
    return {
      id: category.id,
      pid: category.pid,
      next_id: category.next_id,
      title: category.title,
      description: category.description,
    };
  }
}
