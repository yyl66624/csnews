import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateStudentProfileDto {
  @IsString()
  @IsOptional()
  grade?: string;

  @IsArray()
  @IsOptional()
  subjects?: string[];

  @IsString()
  @IsOptional()
  learningGoal?: string;

  @IsString()
  @IsOptional()
  city?: string;
}

export class BindPhoneDto {
  @IsString()
  phone: string;
}
