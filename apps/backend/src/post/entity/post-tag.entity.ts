import {Entity, ManyToOne, PrimaryKey} from "@mikro-orm/core";
import {Post} from "./post.entity";
import {Tag} from "./tag.entity";

@Entity({ tableName: 'post_tags'})
export class PostTag {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => Post)
    post!: Post;

    @ManyToOne(() => Tag)
    tag!: Tag;
}