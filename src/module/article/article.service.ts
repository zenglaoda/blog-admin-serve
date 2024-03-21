import { ResultSetHeader } from 'mysql2';
import { Injectable } from '@nestjs/common';
import { syncCatStore } from '@/module/category';
import { discardUndef, paging, pickKeys } from '@/utils/share';

import {
  CreateDto,
  ListPagingDto,
  UpdateDto,
  Article,
  ArticleLight,
  UpdateStatusDto,
} from './article.dto';
import { CategoryStore } from '@/module/category/category.store';
import { MysqlService } from '@/provider/mysql.service';
import { RowDataPacket } from 'mysql2/promise';
import { ARTICLE_STATUS } from './article.enum';

@Injectable()
export class ArticleService {
  constructor(
    private readonly mysqlService: MysqlService,
    private readonly categoryStore: CategoryStore,
  ) {}

  @syncCatStore()
  async create(dto: CreateDto) {
    if (!this.categoryStore.has(dto.c_id)) {
      throw new Error('不存在的分类!');
    }
    const connection = await this.mysqlService.getConnection();
    let insertId: number;
    try {
      const [results] = await connection.query<ResultSetHeader>(
        `INSERT INTO article (c_id, title, keyword, content, format, file_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.c_id,
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

  @syncCatStore()
  async update(dto: UpdateDto) {
    if (!this.categoryStore.has(dto.c_id)) {
      throw new Error('当前分类不存在!');
    }
    const connection = await this.mysqlService.getConnection();
    try {
      const fields = discardUndef({
        c_id: dto.c_id,
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
          id, c_id, title, keyword, content, format, 
          file_name, status, 
          UNIX_TIMESTAMP(ctime) as ctime, UNIX_TIMESTAMP(mtime) as mtime
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
      const fields = pickKeys(
        [
          'c_id',
          'title',
          'keyword',
          'content',
          'format',
          'file_name',
          'status',
        ],
        article,
      );
      await connection.query(`INSERT INTO article_trash SET ?;`, fields);
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
        id, c_id, title, keyword, format, file_name, status, 
        UNIX_TIMESTAMP(ctime) as ctime, UNIX_TIMESTAMP(mtime) as mtime
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

  private isRightMutateStatus(status: number, mutationStatus: number) {
    if (status === ARTICLE_STATUS.DRAFT) {
      return ARTICLE_STATUS.FINAL === mutationStatus;
    }
    if (status === ARTICLE_STATUS.FINAL) {
      return [ARTICLE_STATUS.DRAFT, ARTICLE_STATUS.PUBLISHED].includes(
        mutationStatus,
      );
    }
    if (status === ARTICLE_STATUS.PUBLISHED) {
      return ARTICLE_STATUS.RETRACTED === mutationStatus;
    }
    if (status === ARTICLE_STATUS.RETRACTED) {
      return [
        ARTICLE_STATUS.DRAFT,
        ARTICLE_STATUS.FINAL,
        ARTICLE_STATUS.PUBLISHED,
      ].includes(mutationStatus);
    }
    return false;
  }

  async updateStatus(dto: UpdateStatusDto) {
    const connection = await this.mysqlService.getConnection();
    try {
      const article = await this.retrieve(dto.id);
      if (!this.isRightMutateStatus(article.status, dto.status)) {
        throw new Error('状态流转错误');
      }

      await connection.query(`UPDATE article SET status = ? WHERE id = ?`, [
        dto.status,
        dto.id,
      ]);
    } finally {
      this.mysqlService.release(connection);
    }
  }
}
