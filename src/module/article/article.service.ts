import { ResultSetHeader, escape } from 'mysql2';
import { Injectable } from '@nestjs/common';
import { MysqlService } from '@/provider/mysql.service';
import { syncCatStore } from '@/module/category';

import { CreateDto } from './article.dto';
import { CategoryStore } from '@/module/category/category.store';

@Injectable()
export class ArticleService {
  constructor(
    private readonly mysqlService: MysqlService,
    private readonly categoryStore: CategoryStore,
  ) {}

  @syncCatStore()
  async create(dto: CreateDto) {
    if (!this.categoryStore.categoryMap.get(dto.cid)) {
      return new Error('当前分类不存在!');
    }
    const connection = await this.mysqlService.getConnection();
    let insertId: number;
    try {
      const [results] = await connection.query<ResultSetHeader>(
        `INSERT INTO article (c_id, title, keyword, content, format, file_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.cid,
          dto.title,
          dto.keyword,
          dto.content,
          dto.format,
          dto.file_name,
          dto.status,
        ],
      );
      insertId = results.insertId;
    } finally {
      this.mysqlService.release(connection);
    }
    return insertId;
  }

  async update(dto: CreateDto) {
    if (!this.categoryStore.categoryMap.get(dto.cid)) {
      return new Error('当前分类不存在!');
    }
    const connection = await this.mysqlService.getConnection();
    let insertId: number;
    try {
      const [results] = await connection.query<ResultSetHeader>(
        `INSERT INTO article (c_id, title, keyword, content, format, file_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.cid,
          dto.title,
          dto.keyword,
          dto.content,
          dto.format,
          dto.file_name,
          dto.status,
        ],
      );
      insertId = results.insertId;
    } finally {
      this.mysqlService.release(connection);
    }
    return insertId;
  }
}
