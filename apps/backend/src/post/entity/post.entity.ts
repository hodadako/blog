import {
    Entity,
    PrimaryKey,
    Property,
    OneToMany,
    Collection
} from '@mikro-orm/core';
import {BaseEntity} from "@backend/common";
import {PostContent, PostTag} from "@backend/post";

@Entity({tableName: 'posts'})
export class Post extends BaseEntity {
    @PrimaryKey()
    id!: number;

    @Property({default: false})
    isPublished: boolean = false;

    @OneToMany(() => PostContent, (pc) => pc.post)
    contents = new Collection<PostContent>(this);

    @OneToMany(() => PostTag, (pt) => pt.post)
    tags = new Collection<PostTag>(this);
}
