import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

@Entity({ tableName: 'posts' })
export class Post {
  @PrimaryKey()
  id!: number;

  @Property({ length: 255 })
  @Index()
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ length: 500, nullable: true })
  excerpt?: string;

  @Property({ length: 100, nullable: true })
  author?: string;

  @Property({ nullable: true })
  @Index()
  publishedAt?: Date;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ default: false })
  isPublished: boolean = false;

  @Property({ length: 255, nullable: true })
  slug?: string;

  @Property({ type: 'json', nullable: true })
  tags?: string[];
} 