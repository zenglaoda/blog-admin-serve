import { Module } from '@nestjs/common';
import { MysqlService } from '@/provider/mysql.service';
import { CategoryModule } from '@/module/category/category.module';
@Module({
  imports: [CategoryModule],
  providers: [MysqlService],
  controllers: [],
})
export class ArticleModule {}
