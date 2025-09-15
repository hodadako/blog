import {PostContentRepository} from '@backend/post/application/required/post-content.repository.port';
import {PostContent} from '@backend/post';
import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@mikro-orm/nestjs';
import {EntityRepository} from '@mikro-orm/core';

@Injectable()
export class PostContentRepositoryImpl implements PostContentRepository {
  constructor(
    @InjectRepository(PostContent)
    private readonly postContentRepository: EntityRepository<PostContent>,
  ) {}

  async create(postContent: PostContent): Promise<PostContent> {
    return this.postContentRepository.create(postContent);
  }
}
