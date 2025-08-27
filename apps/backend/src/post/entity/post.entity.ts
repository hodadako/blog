import {
    Entity,
    PrimaryKey,
    Property,
    OneToMany,
    Collection
} from '@mikro-orm/core';
import {PostTag} from './post-tag.entity';
import {BaseEntity} from "../../base.entity";

@Entity({tableName: 'posts'})
export class Post extends BaseEntity{
    @PrimaryKey()
    id!: number;

    @Property({default: false})
    isPublished: boolean = false;

    @Property({length: 255, nullable: true})
    slug?: string;

    @OneToMany(() => PostTag, (pt) => pt.post)
    tags = new Collection<PostTag>(this);
}
