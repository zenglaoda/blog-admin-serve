import { ResultSetHeader } from 'mysql2';
import { Injectable } from '@nestjs/common';
import { MysqlService } from '@/provider/mysql.service';
import { syncCatStore } from '@/module/category';
import { discardUndef, paging } from '@/utils/share';

import {
  CreateDto,
  ListPagingDto,
  UpdateDto,
  Article,
  ArticleLight,
} from './article.dto';
import { CategoryStore } from '@/module/category/category.store';
import { RowDataPacket, escape } from 'mysql2/promise';

@Injectable()
export class ArticleService {
  constructor(
    private readonly mysqlService: MysqlService,
    private readonly categoryStore: CategoryStore,
  ) {}

  @syncCatStore()
  async create(dto: CreateDto) {
    if (!this.categoryStore.has(dto.cid)) {
      throw new Error('当前分类不存在!');
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

  async update(dto: UpdateDto) {
    if (!this.categoryStore.has(dto.cid)) {
      throw new Error('当前分类不存在!');
    }
    const connection = await this.mysqlService.getConnection();
    try {
      const fields = discardUndef({
        c_id: dto.cid,
        title: dto.title,
        keyword: dto.keyword,
        content: dto.content,
        format: dto.format,
        file_name: dto.file_name,
        status: dto.status,
      });
      await connection.query<ResultSetHeader>(
        `UPDATE article SET ? WHERE id = ?`,
        [fields, dto.id],
      );
    } finally {
      this.mysqlService.release(connection);
    }
  }

  async retrieve(id: number) {
    const connection = await this.mysqlService.getConnection();
    let results: unknown;
    try {
      [results] = await connection.query<RowDataPacket[]>(
        `SELECT
          id, c_id, title, keyword, content, format, file_name, status, ctime, mtime
        FROM
          article
        WHERE
          id = ?
        LIMIT 1;
      `,
        [id],
      );
    } finally {
      this.mysqlService.release(connection);
    }
    return results[0] as Article;
  }

  async delete(id: number) {
    const connection = await this.mysqlService.getConnection();
    try {
      const article = await this.retrieve(id);
      await connection.query(`DELETE FROM article WHERE id = ?;`, [id]);
      const fields = [
        'c_id',
        'title',
        'keyword',
        'content',
        'format',
        'file_name',
        'status',
      ];
      await connection.query(`INSERT INTO article_trash ? VALUES ?;`, [
        fields,
        fields.map((field) => article[field]),
      ]);
    } finally {
      this.mysqlService.release(connection);
    }
  }

  async getList(dto: ListPagingDto) {
    const connection = await this.mysqlService.getConnection();
    const [fromIndex, toIndex] = paging(dto);
    let results: unknown;
    try {
      [results] = await connection.query(`
      SELECT 
        id, c_id, title, keyword, format, file_name, status, ctime, mtime
      FROM 
        article
      LIMIT
        ${fromIndex}, ${toIndex}
      `);
    } finally {
      this.mysqlService.release(connection);
    }
    return results as ArticleLight[];
  }
}
