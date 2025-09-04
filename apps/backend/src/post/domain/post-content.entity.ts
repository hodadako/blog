import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity, Language, Translatable } from '@backend/common';
import { Post } from '@backend/post';

@Entity({ tableName: 'post_contents' })
export class PostContent extends BaseEntity implements Translatable {
  private constructor() {
    super();
  }
  @PrimaryKey()
  id!: number;

  @Property({ length: 255 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ default: true })
  isPublished: boolean = true;

  @Property({ length: 255, nullable: true })
  slug?: string;

  @ManyToOne(() => Post)
  post!: Post;

  @Enum(() => Language)
  language!: Language;

  static create() {}
}
