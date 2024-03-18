import { Module } from '@nestjs/common';
import { CategoryController } from '@/module/category/category.controller';
import { CategoryService } from './category.service';
import { MysqlService } from '@/provider/mysql.service';
import { CategoryStore } from './category.store';

@Module({
  controllers: [CategoryController],
  providers: [MysqlService, CategoryService, CategoryStore],
  exports: [CategoryStore],
})
export class CategoryModule {}
