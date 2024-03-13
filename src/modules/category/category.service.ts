import { Injectable } from '@nestjs/common';
import { MysqlService } from 'src/provider/mysql.service';
import { CreateDTO } from './share/dto';
import { ResultSetHeader } from 'mysql2';

function transformId(id?: string | number) {
  return id === undefined || id === null ? 0 : id;
}

@Injectable()
export class CategoryService {
  constructor(private readonly mysqlService: MysqlService) {
    if (process.env.NODE_ENV === 'develop') {
      this.createTable();
    }
  }

  async createTable() {
    const connection = await this.mysqlService.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS category (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pid INT NOT NULL,
        next_id INT NOT NULL,
        title VARCHAR(40) NOT NULL,
        description VARCHAR(200) NOT NULL,
        c_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        m_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    this.mysqlService.release(connection);
  }

  /**
   * TODO: 确保 pid,next_id 存在且合理
   * 创建分类
   * @param createDTO
   * @returns {number} 自动增长的 id
   */
  async create(createDTO: CreateDTO) {
    const connection = await this.mysqlService.getConnection();
    const [results] = await connection.query<ResultSetHeader>(
      `INSERT INTO category 
        (pid, next_id, title, description) 
      VALUES
        (?, ?, ?, ?)
      `,
      [
        transformId(createDTO.pid),
        transformId(createDTO.nextId),
        createDTO.title,
        createDTO.description,
      ],
    );
    this.mysqlService.release(connection);
    return results.insertId;
  }

  async retrieve() {}
}
