import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WxLoginDto } from './dto/auth.dto';
import { Public } from './decorators/auth.decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('wx-login')
  wxLogin(@Body() dto: WxLoginDto) {
    return this.authService.wxLogin(dto);
  }
}
