import { Inject, Injectable } from '@nestjs/common';
import {
  FindPostsParams,
  PostQuery,
} from '@backend/post/application/provided/post.query';
import { FindPostsResponse } from '@schema/post';
import { PostRepository } from '@backend/post/application/required/post.repository.port';
import { Transactional } from '@mikro-orm/core';
import { PostMapper } from '@backend/post/application/post.mapper';

@Injectable()
export class PostQueryService implements PostQuery {
  constructor(
    @Inject()
    private readonly postRepository: PostRepository,
  ) {}

  @Transactional({ readOnly: true })
  async findAll(query: FindPostsParams): Promise<FindPostsResponse> {
    const fetchedLimit = query.limit + 1;

    const posts = await this.postRepository.findAll(
      query.limit + 1,
      query.language,
      query.tags,
      query.cursor,
    );

    return PostMapper.toFindPostsResponse(posts, query.limit);
  }
}
