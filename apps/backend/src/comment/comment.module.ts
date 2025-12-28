import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CommentRepository } from '@backend/comment/application/required/comment.repository.port';
import { MikroCommentRepository } from '@backend/comment/application/provided/persistence/comment.repository.adapter';
import { Comment } from '@backend/comment/domain/comment.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Comment])],
  providers: [{ provide: CommentRepository, useClass: MikroCommentRepository }],
})
export class CommentModule {}
