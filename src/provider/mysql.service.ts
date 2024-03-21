import { Injectable } from '@nestjs/common';
import { createPool } from 'mysql2/promise';

import type { Pool, PoolConnection, Connection } from 'mysql2/promise';

@Injectable()
export class MysqlService {
  private pool: Pool;

  constructor() {
    this.pool = createPool({
      host: 'localhost',
      user: 'root',
      password: 'abc123',
      database: 'blog_dev',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // debug: ['ComQueryPacket', 'RowDataPacket'],
    });
    this.createTables();
  }

  getConnection(): Promise<Connection> {
    return this.pool.getConnection();
  }

  /**
   * 为统一连接管理，确保只使用该方法释放连接
   * @param connection
   */
  release(connection: Connection) {
    this.pool.releaseConnection(connection as PoolConnection);
  }

  async createTables() {
    const connection = await this.getConnection();
    await this.createCategoryTable(connection);
    await this.createArticleTable(connection);
    await this.createArticleTrashTable(connection);
    this.release(connection);
  }

  async createCategoryTable(connection: Connection) {
    return connection.query(`
      CREATE TABLE IF NOT EXISTS category (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Category Id',
        pid INT NOT NULL COMMENT 'Parent id',
        next_id INT NOT NULL COMMENT 'Next sibling category id or 0',
        title VARCHAR(160) NOT NULL COMMENT 'Category title',
        description VARCHAR(800) NOT NULL  COMMENT 'Category description',
        ctime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createArticleTable(connection: Connection) {
    return connection.query(`
      CREATE TABLE IF NOT EXISTS article (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Article Id',
        c_id INT NOT NULL COMMENT 'Category id',
        title VARCHAR(800) NOT NULL COMMENT 'Article title',
        keyword VARCHAR(800) DEFAULT '' COMMENT 'Article keyword',
        content TEXT DEFAULT NULL COMMENT 'Article content',
        format CHAR(2) DEFAULT '1' COMMENT 'Article format',
        file_name VARCHAR(400) DEFAULT '' COMMENT 'Used as export file name',
        status CHAR(1) DEFAULT '1' COMMENT 'Article status',
        ctime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (c_id) REFERENCES category(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createArticleTrashTable(connection: Connection) {
    return connection.query(`
      CREATE TABLE IF NOT EXISTS article_trash (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Log Id',
        c_id INT NOT NULL COMMENT 'Category id',
        title VARCHAR(800) NOT NULL COMMENT 'Article title',
        keyword VARCHAR(800) DEFAULT '' COMMENT 'Article keyword',
        content TEXT DEFAULT NULL COMMENT 'Article content',
        format CHAR(2) DEFAULT '1' COMMENT 'Article format',
        file_name VARCHAR(400) DEFAULT '' COMMENT 'Used as export file name',
        status CHAR(1) DEFAULT '1' COMMENT 'Article status',
        ctime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
}
