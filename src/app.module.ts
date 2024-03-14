import { Module } from '@nestjs/common';
import { CategoryModule } from './module/category/category.module';

@Module({
  imports: [CategoryModule],
})
export class AppModule {}
