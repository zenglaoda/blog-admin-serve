import { Module } from '@nestjs/common';
import { CategoryModule } from './module/category/category.module';
import { ArticleModule } from './module/article/article.module';

@Module({
  imports: [CategoryModule, ArticleModule],
})
export class AppModule {}
