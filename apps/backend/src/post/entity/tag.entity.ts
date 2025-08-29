import {
    Collection,
    Entity,
    OneToMany,
    PrimaryKey,
    Property,
} from '@mikro-orm/core';
import {PostTag} from './post-tag.entity';
import {BaseEntity} from "../../base.entity";

@Entity({tableName: 'tags'})
export class Tag extends BaseEntity {
    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @OneToMany(() => PostTag, (pt) => pt.tag)
    posts = new Collection<PostTag>(this);
}
