import { Inject, Injectable } from '@nestjs/common';
import { CommentRepository } from '@backend/comment/application/required/comment.repository.port';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateCommentRequest } from '@schema/comment';
import { PostRepository } from '@backend/post/application/required/post.repository.port';

@Injectable()
export class CommentModifyService {
  constructor(
    @Inject()
    private readonly commentRepository: CommentRepository,
    @Inject()
    private readonly postRepository: PostRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async createPendingComment(
    createCommentRequest: CreateCommentRequest,
    postId: number,
  ) {
    const post = await this.postRepository.findById(postId);
    if (post == null) {
      return;
    }
    // TODO: Handle post not found and null cases
  }
}
