import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(private readonly em: EntityRepository<Post>) {}
}
