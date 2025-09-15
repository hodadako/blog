import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { BaseEntity } from '@backend/common';
import { PostContent, PostTag } from '@backend/post';

@Entity({ tableName: 'posts' })
export class Post extends BaseEntity {
  private constructor(viewCount: number) {
    super();
    this.viewCount = viewCount;
  }

  @PrimaryKey()
  id!: number;

  @Property()
  viewCount!: number;

  @OneToMany(() => PostContent, (pc) => pc.post)
  contents = new Collection<PostContent>(this);

  @OneToMany(() => PostTag, (pt) => pt.post)
  tags = new Collection<PostTag>(this);

  static create(): Post {
    return new Post(0);
  }
}
