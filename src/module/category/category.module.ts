import { Module } from '@nestjs/common';
import { CategoryController } from '@/module/category/category.controller';
import { CategoryService } from './category.service';
import { MysqlService } from '@/provider/mysql.service';

@Module({
  controllers: [CategoryController],
  providers: [MysqlService, CategoryService],
})
export class CategoryModule {}
