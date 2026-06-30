import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get('DB_TYPE', 'mysql');

        if (dbType === 'mysql') {
          return {
            type: 'mysql' as const,
            host: config.get<string>('DB_HOST', 'localhost'),
            port: config.get<number>('DB_PORT', 3306),
            username: config.get<string>('DB_USERNAME', 'csnews'),
            password: config.get<string>('DB_PASSWORD', 'csnews123'),
            database: config.get<string>('DB_DATABASE', 'csnews'),
            autoLoadEntities: true,
            synchronize: process.env.NODE_ENV !== 'production',
            charset: 'utf8mb4',
          };
        }

        const dbPath = config.get<string>('DB_PATH') || join(process.cwd(), 'data', 'csnews.sqlite');

        return {
          type: 'better-sqlite3' as const,
          database: dbPath,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TeachersModule,
    OrdersModule,
    ReviewsModule,
    AdminModule,
    PaymentsModule,
  ],
})
export class AppModule {}
