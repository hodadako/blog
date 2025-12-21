import { Injectable } from '@nestjs/common';
import { Post } from '@backend/post';
import { PostRepository } from '@backend/post/application/required/post.repository.port';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';

@Injectable()
export class MikroPostRepository implements PostRepository {
  constructor(
      @InjectRepository(Post)
      private readonly postRepository: EntityRepository<Post>,
  ) {
  }

  create(post: Post): Post {
    return this.postRepository.create(post);
  }
}
