import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class WxLoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class BindPhoneDto {
  @IsString()
  @IsNotEmpty()
  phoneCode: string;
}
