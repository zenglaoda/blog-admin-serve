import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Query,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateDto, ListPagingDto, UpdateDto } from './article.dto';

@Controller('/article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get(':id')
  async retrieve(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.retrieve(id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.delete(id);
  }

  @Post()
  async create(@Body() dto: CreateDto) {
    return this.articleService.create(dto);
  }

  @Put()
  async update(@Body() dto: UpdateDto) {
    return this.articleService.update(dto);
  }

  @Get()
  async getList(@Query() dto: ListPagingDto) {
    return this.articleService.getList(dto);
  }
}
