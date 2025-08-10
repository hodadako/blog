import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Post])],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
