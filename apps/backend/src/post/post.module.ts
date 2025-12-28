import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Post } from '@backend/post/domain/post.entity';
import { PostModifyService } from '@backend/post/application/post.modify.service';
import { PostRepository } from '@backend/post/application/required/post.repository.port';
import { PostContentRepository } from '@backend/post/application/required/post-content.repository.port';
import { MikroPostContentRepository } from '@backend/post/adapter/persistence/post-content.repository.adapter';
import { PostContent } from '@backend/post/domain/post-content.entity';
import { Tag } from '@backend/post/domain/tag.entity';
import { PostTag } from '@backend/post/domain/post-tag.entity';
import { MikroPostRepository } from '@backend/post/adapter/persistence/post.repository.adapter';

@Module({
  imports: [MikroOrmModule.forFeature([Post, PostContent, Tag, PostTag])],
  providers: [
    PostModifyService,
    { provide: PostRepository, useClass: MikroPostRepository },
    { provide: PostContentRepository, useClass: MikroPostContentRepository },
  ],
  exports: [PostModifyService],
})
export class PostModule {}
