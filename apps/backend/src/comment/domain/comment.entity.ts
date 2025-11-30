import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import {
  BaseEntity,
  LabelToLanguage,
  Language,
  Translatable,
} from '@backend/common';
import { Post } from '@backend/post';
import { CreateCommentRequest } from '@schema/comment';

@Entity()
export class Comment extends BaseEntity implements Translatable {
  private constructor(request: CreateCommentRequest) {
    super();
    this.content = request.content;
    this.password = request.password;
    this.author = request.author;
    this.isBlocked = false;
    this.language = LabelToLanguage[request.language];
  }

  @PrimaryKey()
  id!: number;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'boolean' })
  password!: string;

  @Property({ length: 255 })
  isBlocked!: boolean;

  @Property({ length: 255 })
  author!: string;

  @ManyToOne(() => Post)
  post!: Post;

  @Enum(() => Language)
  language: Language;

  static create(request: CreateCommentRequest): Comment {
    return new Comment(request);
  }
}
