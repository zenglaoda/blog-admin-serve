import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateDto } from './share/dto';

@Controller('/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createDto: CreateDto) {
    return this.categoryService.create(createDto);
  }

  @Get(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  retrieve(@Param('id') id: number) {
    return 'retrieve' + id;
  }
}
