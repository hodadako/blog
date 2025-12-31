import { Inject, Injectable } from '@nestjs/common';
import { CommentRepository } from '@backend/comment/application/required/comment.repository.port';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateCommentRequest } from '@schema/comment';
import { PostRepository } from '@backend/post/application/required/post.repository.port';
import { Comment, PendingCommentPayload } from '@backend/comment';
import { Cache } from 'cache-manager';
import { throwIfEntityNotFound } from '@backend/common';
import { EntityManager, Transactional } from '@mikro-orm/core';

@Injectable()
export class CommentModifyService {
  constructor(
    @Inject()
    private readonly commentRepository: CommentRepository,
    @Inject()
    private readonly postRepository: PostRepository,
    @Inject()
    private readonly entityManager: EntityManager,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async createPendingComment(request: CreateCommentRequest, postId: number) {
    await throwIfEntityNotFound(
      this.postRepository.findById(postId),
      '해당 게시글은 존재하지 않습니다.',
    );

    const pendingId = crypto.randomUUID();

    const pendingCommentPayload = PendingCommentPayload.create(request, postId);

    await this.cacheManager.set(pendingId, pendingCommentPayload);

    return pendingId;
  }

  @Transactional()
  async confirmPendingComment(pendingId: string, postId: number) {
    const pendingCommentPayload = await throwIfEntityNotFound(
      this.cacheManager.get<PendingCommentPayload>(
        `pending-comment:${pendingId}`,
      ),
      '해당 댓글은 존재하지 않습니다.',
    );

    const post = await throwIfEntityNotFound(
      this.postRepository.findById(postId),
      '해당 게시글은 존재하지 않습니다.',
    );

    const comment = this.commentRepository.create(
      Comment.create(pendingCommentPayload, post),
    );

    this.commentRepository.create(comment);

    await this.entityManager.flush();
    await this.cacheManager.del(pendingId);

    return comment;
  }
}
