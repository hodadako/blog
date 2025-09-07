import { Injectable } from '@nestjs/common';
import { Post } from '@backend/post';
import { PostRepository } from '@backend/post/application/required/post.repository.port';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';

@Injectable()
export class PostRepositoryImpl implements PostRepository {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: EntityRepository<Post>,
  ) {}

  async create(post: Post): Promise<Post> {
    const managed = this.postRepository.create(post);
    await this.postRepository.getEntityManager().persistAndFlush(managed);
    return managed;
  }
}
