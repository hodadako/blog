import {Collection, Entity, OneToMany, PrimaryKey, Property} from "@mikro-orm/core";
import {PostTag} from "./post-tag.entity";

@Entity({ tableName: 'tags'})
export class Tag {
    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @OneToMany(() => PostTag, pt => pt.tag)
    posts = new Collection<PostTag>(this);
}