import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { CacheModule } from '@nestjs/cache-manager';
import {ServiceExceptionFilter} from "@backend/common/exception/exception.filter";

@Module({
  imports: [
    MikroOrmModule.forRoot({
      migrations: {
        path: 'dist/migrations',
        pathTs: 'src/migrations',
      },
    }),
    PostModule,
    CommentModule,
    CacheModule.register({
      ttl: 5 * 60 * 1000,
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
      AppService,
      {
        provide: 'APP_FILTER',
        useClass: ServiceExceptionFilter,
      }
  ],
})
export class AppModule {}
