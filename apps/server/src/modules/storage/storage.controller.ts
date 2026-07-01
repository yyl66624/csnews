import { Controller, Post, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CosStorageService } from './cos-storage.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('storage')
export class StorageController {
  constructor(private cos: CosStorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('请选择文件');
    const prefix = folder || 'uploads';
    const key = `${prefix}/${user.id}/${Date.now()}_${file.originalname}`;
    return this.cos.upload(key, file.buffer, file.mimetype);
  }
}
