import { Module } from '@nestjs/common';
import { CosStorageService } from './cos-storage.service';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
  providers: [CosStorageService],
  exports: [CosStorageService],
})
export class StorageModule {}
