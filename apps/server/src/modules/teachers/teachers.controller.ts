import { Controller, Get, Post, Put, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/auth.decorators';
import {
  SearchTeachersDto,
  ApplyTeacherDto,
  UpdateTeacherProfileDto,
  UploadCertificateDto,
} from './dto/teacher.dto';

@Controller('teachers')
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @Public()
  @Get()
  search(@Query() dto: SearchTeachersDto) {
    return this.teachersService.search(dto);
  }

  @Get('profile/me')
  getMyProfile(@CurrentUser() user: { id: number }) {
    return this.teachersService.getMyProfile(user.id);
  }

  @Public()
  @Get(':id')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.getDetail(id);
  }

  @Post('apply')
  apply(@CurrentUser() user: { id: number }, @Body() dto: ApplyTeacherDto) {
    return this.teachersService.apply(user.id, dto);
  }

  @Put('profile')
  updateProfile(@CurrentUser() user: { id: number }, @Body() dto: UpdateTeacherProfileDto) {
    return this.teachersService.updateProfile(user.id, dto);
  }

  @Post('certificates')
  uploadCertificate(@CurrentUser() user: { id: number }, @Body() dto: UploadCertificateDto) {
    return this.teachersService.uploadCertificate(user.id, dto);
  }
}
