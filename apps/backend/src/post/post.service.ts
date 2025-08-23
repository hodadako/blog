import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { Post } from './entity/post.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import {CreatePostRequest} from "../../../../packages/schema/post";

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: EntityRepository<Post>,
  ) {}

  create(request: CreatePostRequest) {
    
  }
}
