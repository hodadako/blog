import {Module} from '@nestjs/common';
import {MikroOrmModule} from '@mikro-orm/nestjs';
import {Post} from '@backend/post/domain/post.entity';
import {PostModifyService} from '@backend/post/application/post.modify.service';
import {PostRepositoryImpl} from '@backend/post/adapter/persistence/post.repository.adapter';
import {PostRepository} from '@backend/post/application/required/post.repository.port';
import {PostContentRepository} from '@backend/post/application/required/post-content.repository.port';
import {PostContentRepositoryImpl} from "@backend/post/adapter/persistence/post-content.repository.adapter";

@Module({
    imports: [MikroOrmModule.forFeature([Post])],
    providers: [
        PostModifyService,
        {provide: PostRepository, useClass: PostRepositoryImpl},
        {provide: PostContentRepository, useClass: PostContentRepositoryImpl},
    ],
    exports: [PostModifyService],
})
export class PostModule {
}
