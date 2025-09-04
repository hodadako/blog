import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { BaseEntity } from '@backend/common';
import { PostContent, PostTag } from '@backend/post';
import { CreatePostRequest } from '@schema/post';

@Entity({ tableName: 'posts' })
export class Post extends BaseEntity {
  private constructor() {
    super();
  }

  @PrimaryKey()
  id!: number;

  @Property()
  viewCount: number = 0;

  @OneToMany(() => PostContent, (pc) => pc.post)
  contents = new Collection<PostContent>(this);

  @OneToMany(() => PostTag, (pt) => pt.post)
  tags = new Collection<PostTag>(this);

  static create(createPostRequest: CreatePostRequest): Post {
    const post = new Post();

    return post;
  }
}
