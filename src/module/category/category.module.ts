import { Module } from '@nestjs/common';
import { CategoryController } from '@/module/category/category.controller';
import { MysqlService } from '@/provider/mysql.service';
import { CategoryService } from './category.service';
import { CategoryStore } from './category.store';

@Module({
  providers: [MysqlService, CategoryStore, CategoryService],
  controllers: [CategoryController],
  exports: [CategoryStore],
})
export class CategoryModule {}
