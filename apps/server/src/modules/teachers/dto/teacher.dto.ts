import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CertType } from '../../../common/enums';

export class SearchTeachersDto {
  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  gradeLevel?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  sortBy?: 'rating' | 'price' | 'experience';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

export class TeacherSubjectDto {
  @IsString()
  subject: string;

  @IsString()
  gradeLevel: string;

  @IsNumber()
  @Min(0)
  price: number;
}

export class TeacherScheduleDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}

export class ApplyTeacherDto {
  @IsString()
  realName: string;

  @IsString()
  idCard: string;

  @IsString()
  education: string;

  @IsNumber()
  @Min(0)
  teachingYears: number;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  teachingStyle?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherSubjectDto)
  subjects: TeacherSubjectDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherScheduleDto)
  schedules: TeacherScheduleDto[];
}

export class UpdateTeacherProfileDto {
  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  teachingStyle?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherSubjectDto)
  @IsOptional()
  subjects?: TeacherSubjectDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherScheduleDto)
  @IsOptional()
  schedules?: TeacherScheduleDto[];
}

export class UploadCertificateDto {
  @IsEnum(CertType)
  certType: CertType;

  @IsString()
  imageUrl: string;
}
