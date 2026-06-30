import { Controller, Get, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateStudentProfileDto, BindPhoneDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: { id: number }) {
    return this.usersService.getProfile(user.id);
  }

  @Put('student-profile')
  updateStudentProfile(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.usersService.updateStudentProfile(user.id, dto);
  }

  @Put('bind-phone')
  bindPhone(@CurrentUser() user: { id: number }, @Body() dto: BindPhoneDto) {
    return this.usersService.bindPhone(user.id, dto);
  }
}
