import {Entity, ManyToOne, PrimaryKey} from '@mikro-orm/core';
import {BaseEntity} from "@backend/common";
import {Post, Tag} from "@backend/post";

@Entity({tableName: 'post_tags'})
export class PostTag extends BaseEntity {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => Post)
    post!: Post;

    @ManyToOne(() => Tag)
    tag!: Tag;
}
