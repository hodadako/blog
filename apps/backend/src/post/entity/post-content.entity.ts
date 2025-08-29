import {Entity, Enum, ManyToOne, PrimaryKey, Property} from "@mikro-orm/core";
import {BaseEntity} from "../../base.entity";
import {Post} from "./post.entity";

@Entity({tableName: 'post_contents'})
export class PostContent extends BaseEntity {
    @PrimaryKey()
    id!: number;

    @Property({length: 255})
    title!: string;

    @Property({type: 'text'})
    content!: string;

    @ManyToOne(() => Post)
    post!: Post;

    @Enum()
    type!: string;
}

