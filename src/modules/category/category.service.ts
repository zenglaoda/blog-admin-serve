import { Injectable } from '@nestjs/common';
import { MysqlService } from 'src/provider/mysql.service';

@Injectable()
export class CategoryService {
  constructor(private readonly mysqlService: MysqlService) {
    
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  }

}
