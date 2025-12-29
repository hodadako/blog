import { CreateCommentRequest } from '@schema/comment';
import { LabelToLanguage, Language, Translatable } from '@backend/common';

export class PendingCommentPayload implements Translatable {
  private constructor(request: CreateCommentRequest, postId: number) {
    this.postId = postId;
    this.content = request.content;
    this.password = request.password;
    this.author = request.author;
    this.language = LabelToLanguage[request.language];
  }

  postId!: number;
  content!: string;
  password!: string;
  author!: string;
  language: Language;

  static create(
    request: CreateCommentRequest,
    postId: number,
  ): PendingCommentPayload {
    return new PendingCommentPayload(request, postId);
  }
}
