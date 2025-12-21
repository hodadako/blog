import { CommentRepository } from '@backend/comment/application/required/comment.repository.port';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Comment } from '@backend/comment';

@Injectable()
export class MikroCommentRepository implements CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: EntityRepository<Comment>,
  ) {}

  create(comment: Comment): Comment {
    return this.commentRepository.create(comment);
  }
}
