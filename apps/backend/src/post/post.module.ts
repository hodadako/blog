import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Post } from '@backend/post/domain/post.entity';
import { PostService } from '@backend/post/application/post.service';
import { PostRepositoryImpl } from '@backend/post/adapter/persistence/post.repository.adapter';
import { PostRepository } from '@backend/post/application/required/post.repository.port';

@Module({
  imports: [MikroOrmModule.forFeature([Post])],
  providers: [
    PostService,
    { provide: PostRepository, useClass: PostRepositoryImpl },
  ],
  exports: [PostService],
})
export class PostModule {}
