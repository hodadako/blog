import { Inject, Injectable } from '@nestjs/common';
import { CreatePostRequest } from '@schema/post';
import { Post, PostContent } from '@backend/post';
import { PostCreate } from '@backend/post/application/provided/post.create';
import { PostRepository } from '@backend/post/application/required/post.repository.port';
import { PostContentRepository } from '@backend/post/application/required/post-content.repository.port';

@Injectable()
export class PostModifyService implements PostCreate {
  constructor(
    @Inject()
    private readonly postRepository: PostRepository,
    @Inject()
    private readonly postContentRepository: PostContentRepository,
  ) {}

  async create(createPostRequest: CreatePostRequest): Promise<Post> {
    const post = Post.create(createPostRequest);
    const contents = createPostRequest.contents.map((content) => {
      const postContent = PostContent.create(content);
      this.postContentRepository.create(postContent);
      postContent.post = post;
      return postContent;
    });
    return this.postRepository.create(post);
  }
}
