import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { BaseEntity } from '@backend/common';
import { PostContent, PostTag } from '@backend/post';
import {CreatePostRequest} from "@schema/post";

@Entity({ tableName: 'posts' })
export class Post extends BaseEntity {
  private constructor(request: CreatePostRequest, viewCount: number) {
    super();
    this.viewCount = viewCount;
    this.name = request.name;
  }

  @PrimaryKey()
  id!: number;

  @Property({ unique: true, length: 255 })
  name!: string;

  @Property()
  viewCount!: number;

  @OneToMany(() => PostContent, (pc) => pc.post)
  contents = new Collection<PostContent>(this);

  @OneToMany(() => PostTag, (pt) => pt.post)
  tags = new Collection<PostTag>(this);

  static create(request: CreatePostRequest): Post {
    return new Post(request,0);
  }
}
