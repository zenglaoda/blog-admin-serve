import { ResultSetHeader, escape } from 'mysql2';
import { Injectable } from '@nestjs/common';
import { MysqlService } from '@/provider/mysql.service';
import { CreateDto, UpdateCto } from './share/dto';

import type { RowDataPacket } from 'mysql2';
import type { Category } from './share/model';

function transformId(id?: string | number) {
  return id === undefined || id === null ? 0 : id;
}

@Injectable()
export class CategoryService {
  private categories: Category[] = [];
  private categorySet: Map<number, Category> = new Map();
  private isStale = true;

  constructor(private readonly mysqlService: MysqlService) {}

  async pullList() {
    if (this.isStale) {
      const connection = await this.mysqlService.getConnection();
      const [results] = await connection.query<RowDataPacket[]>(`
        SELECT id, pid, next_id, title, description FROM category;
      `);
      this.mysqlService.release(connection);
      this.categories = results as Category[];
      this.categories.forEach((item) => {
        this.categorySet.set(item.id, item);
      });
      this.isStale = false;
    }
  }

  async getList() {
    await this.pullList();
    return this.categories;
  }

  private isValidId(id: number) {
    return id === 0 || this.categorySet.has(id);
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
        transformId(createDto.pid),
        transformId(createDto.nextId),
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
