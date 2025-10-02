import {Entity, Enum, ManyToOne, PrimaryKey, Property} from "@mikro-orm/core";
import {BaseEntity, LabelToLanguage, Language, Translatable} from "@backend/common";
import {Post} from "@backend/post";

@Entity()
export class Comment extends BaseEntity implements Translatable {
    constructor(request: any) {
        super();
        this.isBlocked = false;
        this.language = LabelToLanguage[request.language];
    }

    @PrimaryKey()
    id!: number;

    @Property({type: 'text'})
    content!: string;

    @Property({ length: 255})
    isBlocked!: boolean;

    @Property({length: 255})
    author!: string;

    @ManyToOne(() => Post)
    post!: Post;

    @Enum(() => Language)
    language: Language;
}