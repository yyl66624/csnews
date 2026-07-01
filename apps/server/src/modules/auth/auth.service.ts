import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums';
import { WxLoginDto } from './dto/auth.dto';
import { maskPhone } from '../../common/utils/mask.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async wxLogin(dto: WxLoginDto) {
    const { openid } = await this.code2Session(dto.code);

    let user = await this.userRepo.findOne({ where: { openid } });
    if (!user) {
      user = this.userRepo.create({
        openid,
        nickname: dto.nickname || '微信用户',
        avatarUrl: dto.avatarUrl || null,
        role: UserRole.STUDENT,
      });
      await this.userRepo.save(user);
    } else if (dto.nickname || dto.avatarUrl) {
      if (dto.nickname) user.nickname = dto.nickname;
      if (dto.avatarUrl) user.avatarUrl = dto.avatarUrl;
      await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({
      sub: user.id,
      openid: user.openid,
      role: user.role,
    });

    return { token, user: this.sanitizeUser(user) };
  }

  /** 开发模式：code 以 dev_ 开头时使用 mock openid */
  private async code2Session(code: string): Promise<{ openid: string }> {
    const appId = this.config.get('WX_APPID');
    const secret = this.config.get('WX_SECRET');
    const isProduction = process.env.NODE_ENV === 'production';

    // 开发模式兜底：未配置真实 appid 或 code 以 dev_ 开头时使用 mock
    if (!isProduction && (code.startsWith('dev_') || !appId || appId === 'your_wx_appid')) {
      return { openid: code.startsWith('dev_') ? code : `dev_${code}` };
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
    }

    return { openid: data.openid };
  }

  sanitizeUser(user: User) {
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: maskPhone(user.phone),
      role: user.role,
    };
  }
}
