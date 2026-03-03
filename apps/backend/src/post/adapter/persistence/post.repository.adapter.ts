import { Inject, Injectable } from '@nestjs/common';
import { Post } from '@backend/post';
import { PostRepository } from '@backend/post/application/required/post.repository.port';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Language } from '@backend/common';

@Injectable()
export class MikroPostRepository implements PostRepository {
  
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: EntityRepository<Post>,
    @Inject()
    private readonly entityManager: EntityManager,
  ) {}

  findAll(
    limit: number,
    language: Language,
    tags?: string,
    cursor?: string,
  ): Promise<Post[]> {
    throw new Error('Method not implemented.');
  }

  async findById(id: number): Promise<Post | null> {
    return await this.postRepository.findOne({ id });
  }

  create(post: Post): Post {
    return this.postRepository.create(post);
  }
}
