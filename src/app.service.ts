import { Injectable } from '@nestjs/common';
import { MysqlService } from './provider/mysql.service';

@Injectable()
export class AppService {
  constructor(private readonly mysqlService: MysqlService) {}

  async getUsers(): Promise<any> {
    const connection = await this.mysqlService.getConnection();
    const [results] = await connection.execute('SELECT * FROM `users`');
    connection.release();
    return results;
  }
}
