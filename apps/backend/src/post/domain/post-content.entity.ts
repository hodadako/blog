import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import {
  BaseEntity,
  LabelToLanguage,
  Language,
  Translatable,
} from '@backend/common';
import { Post } from '@backend/post';
import { PostContentCreateRequest } from '@schema/post';

@Entity({ tableName: 'post_contents' })
export class PostContent extends BaseEntity implements Translatable {
  private constructor(request: PostContentCreateRequest) {
    super();
    this.title = request.title;
    this.description = request.description;
    this.content = request.content;
    this.language = LabelToLanguage[request.language];
    this.slug = request.slug;
    this.isPublished = true;
  }

  @PrimaryKey()
  id!: number;

  @Property({ length: 255 })
  title!: string;

  @Property({ length: 255 })
  description!: string;

  @Property({ length: 255 })
  content!: string;

  @Property({ default: true })
  isPublished: boolean;

  @Property({ length: 255, nullable: true })
  slug?: string;

  @ManyToOne(() => Post)
  post!: Post;

  @Enum(() => Language)
  language!: Language;

  static create(request: PostContentCreateRequest): PostContent {
    return new PostContent(request);
  }
}
