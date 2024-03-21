import { Min } from 'class-validator';

export class PagingDto {
  @Min(1)
  page: number;

  @Min(1)
  pageSize: number;
}
