import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** 腾讯云 COS 上传服务（阶段 A5 骨架，配置后可用） */
@Injectable()
export class CosStorageService {
  private readonly logger = new Logger(CosStorageService.name);

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return !!(
      this.config.get('TX_COS_SECRET_ID') &&
      this.config.get('TX_COS_SECRET_KEY') &&
      this.config.get('TX_COS_BUCKET') &&
      this.config.get('TX_COS_REGION')
    );
  }

  /** 上传文件，返回访问 URL（生产需配置 COS SDK） */
  async upload(key: string, _buffer: Buffer, contentType: string): Promise<{ url: string; key: string }> {
    if (!this.isConfigured()) {
      this.logger.warn('COS 未配置，返回 mock URL');
      return {
        key,
        url: `https://mock-cos.local/${key}`,
      };
    }

    // TODO: 接入 cos-nodejs-sdk-v5
    this.logger.log(`COS 上传占位: ${key} (${contentType})`);
    const bucket = this.config.get<string>('TX_COS_BUCKET');
    const region = this.config.get<string>('TX_COS_REGION');
    return {
      key,
      url: `https://${bucket}.cos.${region}.myqcloud.com/${key}`,
    };
  }
}
