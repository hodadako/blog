import {Entity, PrimaryKey, Property} from "@mikro-orm/core";

@Entity({ tableName: 'post_contents'})
export class PostContent {
    @PrimaryKey()
    id!: number;

    @Property({ length: 255})
    title!: string;

    @Property({ type: 'text'})
    content!: string;

    @Property()
}