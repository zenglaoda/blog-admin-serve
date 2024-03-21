import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateDto, UpdateDto } from './category.dto';

@Controller('/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createDto: CreateDto) {
    return this.categoryService.create(createDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }

  @Put()
  @UsePipes(new ValidationPipe({ transform: true }))
  update(@Body() updateDto: UpdateDto) {
    return this.categoryService.update(updateDto);
  }

  @Get(':id')
  retrieve(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.retrieve(id);
  }

  @Get()
  getList() {
    return this.categoryService.getList();
  }
}
