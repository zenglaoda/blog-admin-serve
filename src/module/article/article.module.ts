import { Module } from '@nestjs/common';
import { MysqlService } from '@/provider/mysql.service';
import { CategoryModule } from '@/module/category/category.module';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
@Module({
  imports: [CategoryModule],
  providers: [MysqlService, ArticleService],
  controllers: [ArticleController],
})
export class ArticleModule {}
