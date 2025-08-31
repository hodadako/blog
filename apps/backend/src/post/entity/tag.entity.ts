import {
    Collection,
    Entity,
    OneToMany,
    PrimaryKey,
    Property,
} from '@mikro-orm/core';
import {BaseEntity} from "@backend/common";
import {PostTag} from "@backend/post";

@Entity({tableName: 'tags'})
export class Tag extends BaseEntity {
    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @OneToMany(() => PostTag, (pt) => pt.tag)
    posts = new Collection<PostTag>(this);
}
