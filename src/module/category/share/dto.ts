import { IsOptional, Length, Min } from 'class-validator';

export class CreateDto {
  @Min(0)
  @IsOptional()
  pid: number;

  @Min(0)
  @IsOptional()
  nextId: number;

  @Length(1, 40)
  title: string;

  @Length(0, 200)
  description: string;
}

export class UpdateCto {
  @Min(1)
  id: number;

  @Min(0)
  @IsOptional()
  pid: number;

  @Min(0)
  @IsOptional()
  nextId: number;

  @Length(1, 40)
  title: string;

  @Length(0, 200)
  description: string;
}

export class MoveDto {
  @Min(1)
  id: number;

  @Min(0)
  @IsOptional()
  pid: number;

  @Min(0)
  @IsOptional()
  nextId: number;
}
