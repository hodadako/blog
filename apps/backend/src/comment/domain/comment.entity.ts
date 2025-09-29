import {Entity, Enum} from "@mikro-orm/core";
import {BaseEntity, LabelToLanguage, Language, Translatable} from "@backend/common";

@Entity()
export class Comment extends BaseEntity implements Translatable {
    constructor(request: any) {
        super();
        this.language = LabelToLanguage[request.language];
    }

    @Enum(() => Language)
    language: Language;
}