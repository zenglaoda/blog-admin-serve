import { IsByteLength, IsEnum, Length, Min } from 'class-validator';
import { ARTICLE_FORMAT, ARTICLE_STATUS } from './article.enum';
import { PagingDto } from '@/common/paging.dto';

export class CreateDto {
  @Min(1)
  c_id: number;

  @Length(1, 200)
  title: string;

  @Length(0, 200)
  keyword: string;

  @IsByteLength(0, 65535)
  content: string;

  @IsEnum(ARTICLE_FORMAT)
  format: number;

  @Length(0, 100)
  file_name: string;

  @IsEnum({ DRAFT: ARTICLE_STATUS.DRAFT, FINAL: ARTICLE_STATUS.FINAL })
  status: number;
}

export class UpdateDto {
  @Min(1)
  id: number;

  @Min(1)
  c_id: number;

  @Length(1, 200)
  title: string;

  @Length(0, 200)
  keyword: string;

  @IsByteLength(0, 65535)
  content: string;

  @IsEnum(ARTICLE_FORMAT)
  format: number;

  @Length(0, 100)
  file_name: string;

  @IsEnum({ DRAFT: ARTICLE_STATUS.DRAFT, FINAL: ARTICLE_STATUS.FINAL })
  status: number;
}

export class ListPagingDto extends PagingDto {}

export class Article {
  id: number;
  c_id: number;
  title: string;
  keyword: string;
  content: string;
  format: number;
  file_name: string;
  status: number;
  ctime: string;
  mtime: string;
}

export class ArticleLight {
  id: number;
  c_id: number;
  title: string;
  keyword: string;
  format: string;
  file_name: string;
  status: string;
  ctime: string;
  mtime: string;
}
