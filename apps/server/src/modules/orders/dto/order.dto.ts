import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsNumber()
  teacherId: number;

  @IsString()
  subject: string;

  @IsString()
  gradeLevel: string;

  @IsString()
  lessonDate: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsString()
  @IsOptional()
  requirement?: string;
}

export class OrderActionDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ListOrdersDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  role?: 'student' | 'teacher';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}
