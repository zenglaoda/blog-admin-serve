import { IsByteLength, IsEnum, Length, Min } from 'class-validator';
import { ARTICLE_FORMAT, ARTICLE_STATUS } from './article.enum';

export class CreateDto {
  @Min(1)
  cid: number;

  @Length(1, 200)
  title: string;

  @Length(0, 200)
  keyword: string;

  @IsByteLength(0, 65535)
  content: string;

  @IsEnum(ARTICLE_FORMAT)
  format: string;

  @Length(0, 100)
  file_name: string;

  @IsEnum(ARTICLE_STATUS)
  status: string;
}

export class UpdateDto {
  @Min(1)
  id: number;

  @Min(1)
  cid: number;

  @Length(1, 200)
  title: string;

  @Length(0, 200)
  keyword: string;

  @IsByteLength(0, 65535)
  content: string;

  @IsEnum(ARTICLE_FORMAT)
  format: string;

  @Length(0, 100)
  file_name: string;

  @IsEnum(ARTICLE_STATUS)
  status: string;
}
