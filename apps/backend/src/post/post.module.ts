import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Post } from '@backend/post/domain/post.entity';
import { PostModifyService } from '@backend/post/application/post.modify.service';
import { PostRepositoryImpl } from '@backend/post/adapter/persistence/post.repository.adapter';
import { PostRepository } from '@backend/post/application/required/post.repository.port';
import { PostContentRepository } from '@backend/post/application/required/post-content.repository.port';
import { PostContentRepositoryImpl } from '@backend/post/adapter/persistence/post-content.repository.adapter';
import { PostContent } from '@backend/post/domain/post-content.entity';
import { Tag } from '@backend/post/domain/tag.entity';
import { PostTag } from '@backend/post/domain/post-tag.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Post, PostContent, Tag, PostTag])],
  providers: [
    PostModifyService,
    { provide: PostRepository, useClass: PostRepositoryImpl },
    { provide: PostContentRepository, useClass: PostContentRepositoryImpl },
  ],
  exports: [PostModifyService],
})
export class PostModule {}
