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
    this.release(connection);
  }

  async createCategoryTable(connection: Connection) {
    return connection.query(`
      CREATE TABLE IF NOT EXISTS category (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pid INT NOT NULL,
        next_id INT NOT NULL,
        title VARCHAR(40) NOT NULL,
        description VARCHAR(200) NOT NULL,
        ctime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
}
