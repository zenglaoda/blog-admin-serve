import { ResultSetHeader, escape } from 'mysql2';
import { Injectable } from '@nestjs/common';
import { MysqlService } from '@/provider/mysql.service';
import { CreateDto, MoveDto, UpdateCto } from './category.dto';
import { syncCatStore } from './category.store';

import { RowDataPacket, Connection } from 'mysql2/promise';
import { CategoryStore } from './category.store';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryStore: CategoryStore,
    private readonly mysqlService: MysqlService,
  ) {}

  @syncCatStore()
  getList() {
    return this.categoryStore.categoryTree;
  }

  /**
   * 创建分类，需要确保如下条件
   * 1. pid 存在或者等于 0
   * 2. next_id 存在或者等于 0，next_id 如果不等于 0, 则 next_id 所对分类的pid应与创建的分类pid 相同
   * 3. next_id 等于 0 时，需要将兄弟分类的 next_id 进行修改
   * @param createDto
   * @returns 自动增长的 id
   */
  async create(createDto: CreateDto) {
    let insertId: number;
    const connection = await this.mysqlService.getConnection();
    try {
      const categoryMap = await this.categoryStore.getCategoryMap();

      createDto.pid = createDto.pid || 0;
      createDto.nextId = createDto.nextId || 0;

      const isValidId = (id: number) => id === 0 || categoryMap.has(id);

      if (!isValidId(createDto.pid)) {
        throw new Error('不存在的 pid');
      }
      if (!isValidId(createDto.nextId)) {
        throw new Error('不存在的 nextId');
      }
      const nextCategory = categoryMap.get(createDto.nextId);
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
        const prevCategory = this.categoryStore.getPrevCategory(
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
        this.categoryStore.markStale();
      } catch (err) {
        await connection.rollback();
        throw err;
      }
    } finally {
      this.mysqlService.release(connection);
    }
    return insertId;
  }

  @syncCatStore()
  async remove(id: number) {
    await this.categoryStore.notify('remove', id);
    const categoryMap = this.categoryStore.categoryMap;
    const connection = await this.mysqlService.getConnection();
    try {
      const category = categoryMap.get(id);
      if (category.children.length > 0) {
        throw new Error('删除失败，当前分类下存在子分类');
      }

      await connection.beginTransaction();
      try {
        await connection.query<RowDataPacket[]>(
          `DELETE FROM category WHERE id = ?`,
          [id],
        );
        const prevCategory = this.categoryStore.getPrevCategory(id);
        const category = categoryMap.get(id);
        if (prevCategory) {
          await connection.query<RowDataPacket[]>(
            `UPDATE category SET next_id = ? WHERE id = ?`,
            [category.next_id, prevCategory.id],
          );
        }
        await connection.commit();
        this.categoryStore.markStale();
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
          description = ${escape(updateDto.description)}
        WHERE
          id = ${escape(updateDto.id)};
        `,
      );
      this.categoryStore.markStale();
    } finally {
      this.mysqlService.release(connection);
    }
  }

  async move(moveDto: MoveDto) {
    moveDto.pid = moveDto.pid || 0;
    moveDto.nextId = moveDto.nextId || 0;

    const connection = await this.mysqlService.getConnection();
    await connection.beginTransaction();
    try {
      await this.mv(connection, moveDto);
      await connection.commit();
      this.categoryStore.markStale();
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
    const categoryMap = await this.categoryStore.getCategoryMap();
    const category = categoryMap.get(moveDto.id);
    let prevCategory = this.categoryStore.getPrevCategory(moveDto.id);
    if (prevCategory) {
      await connection.query(`UPDATE category SET next_id = ? WHERE id = ?`, [
        category.next_id,
        prevCategory.id,
      ]);
    }

    prevCategory = this.categoryStore.getPrevCategory(moveDto.nextId);
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
    const categoryMap = await this.categoryStore.getCategoryMap();
    const category = categoryMap.get(id);
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
