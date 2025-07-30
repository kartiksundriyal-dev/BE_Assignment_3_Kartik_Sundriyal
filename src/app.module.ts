import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthTokensModule } from './auth-tokens/auth-tokens.module';
import { ItemsModule } from './items/items.module';
import { BidsModule } from './bids/bids.module';
import { PaymentsModule } from './payments/payments.module';
import { BiddingSessionsModule } from './bidding-sessions/bidding-sessions.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (cfg: ConfigService): TypeOrmModuleOptions => ({
                type: 'postgres',
                host: cfg.get<string>('DB_HOST'),
                port: cfg.get<number>('DB_PORT'),
                username: cfg.get<string>('DB_USERNAME'),
                password: cfg.get<string>('DB_PASSWORD'),
                database: cfg.get<string>('DB_NAME'),
                autoLoadEntities: true,
            }),
        }),
        UsersModule,
        AuthTokensModule,
        ItemsModule,
        BidsModule,
        PaymentsModule,
        BiddingSessionsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
