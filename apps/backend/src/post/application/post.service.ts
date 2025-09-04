import { Inject, Injectable } from '@nestjs/common';
import { CreatePostRequest } from '@schema/post';
import { Post, PostCreate, PostRepository } from '@backend/post';

@Injectable()
export class PostService implements PostCreate {
  constructor(
    @Inject()
    private readonly postRepository: PostRepository,
  ) {}

  async create(createPostRequest: CreatePostRequest): Promise<Post> {
    return this.postRepository.create(Post.create(createPostRequest));
  }
}
