import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { Post } from './entity/post.entity';

@Injectable()
export class PostService {
  constructor(private readonly postRepository: EntityRepository<Post>) {}
}
