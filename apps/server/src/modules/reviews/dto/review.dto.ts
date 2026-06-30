import { IsNumber, IsString, IsOptional, IsArray, IsBoolean, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}
