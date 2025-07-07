import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChessModule } from './chess/chess.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EloModule } from './elo/elo.module';
import { User } from './user/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [User],
        synchronize: configService.get('NODE_ENV') !== 'production',
        ssl: { rejectUnauthorized: false },
      }),
      inject: [ConfigService],
    }),
    ChessModule,
    UserModule,
    AuthModule,
    EloModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
