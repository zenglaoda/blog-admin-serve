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
import { CreateDto, UpdateCto } from './share/dto';

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
  update(@Body() updateCto: UpdateCto) {
    return this.categoryService.update(updateCto);
  }

  @Get(':id')
  retrieve(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.retrieve(id);
  }

  @Get('list')
  getList() {
    return this.categoryService.getList() as unknown;
  }
}
