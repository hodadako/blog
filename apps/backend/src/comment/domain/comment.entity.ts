import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity, Language, Translatable } from '@backend/common';
import { Post } from '@backend/post';
import { PendingCommentPayload } from '@backend/comment';

@Entity()
export class Comment extends BaseEntity implements Translatable {
  private constructor(payload: PendingCommentPayload, post: Post) {
    super();
    this.content = payload.content;
    this.password = payload.password;
    this.author = payload.author;
    this.isBlocked = false;
    this.post = post;
    this.language = payload.language;
  }

  @PrimaryKey()
  id!: number;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'text' })
  password!: string;

  @Property({ length: 255 })
  isBlocked!: boolean;

  @Property({ length: 255 })
  author!: string;

  @ManyToOne(() => Post)
  post!: Post;

  @Enum(() => Language)
  language: Language;

  static create(payload: PendingCommentPayload, post: Post): Comment {
    return new Comment(payload, post);
  }
}
