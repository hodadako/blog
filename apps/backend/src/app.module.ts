import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './posts/post.module';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      migrations: {
        path: 'dist/migrations',
        pathTs: 'src/migrations',
      },
    }),
    PostModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
