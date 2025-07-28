import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      dbName: process.env.DB_NAME || 'blog_db',
      entities: ['dist/**/*.entity.js'],
      entitiesTs: ['src/**/*.entity.ts'],
      debug: process.env.NODE_ENV === 'development',
      migrations: {
        path: 'dist/migrations',
        pathTs: 'src/migrations',
      },
    }),
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
