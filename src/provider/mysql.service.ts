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

  releaseConnection(connection: PoolConnection) {
    this.pool.releaseConnection(connection);
  }
}
