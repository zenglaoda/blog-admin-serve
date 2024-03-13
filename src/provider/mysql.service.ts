import { Injectable } from '@nestjs/common';
import { createPool } from 'mysql2/promise';

import type { Pool, PoolConnection } from 'mysql2/promise';

@Injectable()
export class MysqlService {
  private pool: Pool;

  constructor() {
    this.pool = createPool({
      host: 'localhost',
      user: 'root',
      password: 'abc123',
      database: 'dev_english',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  getConnection() {
    return this.pool.getConnection();
  }

  /**
   * 为统一连接管理，确保只使用该方法释放连接
   * @param connection
   */
  release(connection: PoolConnection) {
    this.pool.releaseConnection(connection);
  }
}
