import {Entity, PrimaryKey, Property, Index, OneToMany, Collection} from '@mikro-orm/core';
import {PostTag} from "./post-tag.entity";

@Entity({ tableName: 'posts' })
export class Post {
  @PrimaryKey()
  id!: number;

  @Property({ length: 255 })
  @Index()
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ default: false })
  isPublished: boolean = false;

  @Property({ length: 255, nullable: true })
  slug?: string;

  @OneToMany(() => PostTag, pt => pt.post)
  tags = new Collection<PostTag>(this);
}
