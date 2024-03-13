import { Module } from '@nestjs/common';
import { MysqlService } from './provider/mysql.service';
import { CatsService } from './cats/cats.service';

@Module({
  imports: [],
  controllers: [],
  providers: [MysqlService, CatsService],
})
export class AppModule {}
