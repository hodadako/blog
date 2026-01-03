import { Inject, Injectable } from '@nestjs/common';
import {
  FindPostsParams,
  PostQuery,
} from '@backend/post/application/provided/post.query';
import { FindPostsResponse } from '@schema/post';
import { PostRepository } from '@backend/post/application/required/post.repository.port';
import { EntityManager } from '@mikro-orm/core';

@Injectable()
export class PostQueryService implements PostQuery {
  constructor(
    @Inject()
    private readonly postRepository: PostRepository,
    @Inject()
    private readonly entityManager: EntityManager,
  ) {}

  async findAll(query: FindPostsParams): Promise<FindPostsResponse> {
    //TODO: implement cursor-based pagination
    const decodedCursor = query.cursor
      ? Buffer.from(query.cursor, 'base64').toString('ascii')
      : null;

    await this.postRepository.findById(1);
    throw new Error('Not implemented' + decodedCursor);
  }
}
