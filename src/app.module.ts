import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MysqlService } from './provider/mysql.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, MysqlService],
})
export class AppModule {}
