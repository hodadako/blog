import {
  Body,
  Controller,
  Get,
  Inject,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePostRequest, FindPostsResponse } from '@schema/post';
import { PostModify } from '@backend/post/application/provided/post.modify';
import { Language } from '@backend/common';
import { PostQuery } from '@backend/post/application/provided/post.query';

@Controller('posts')
export class PostController {
  constructor(
    @Inject()
    private readonly postModify: PostModify,
    @Inject()
    private readonly postQuery: PostQuery,
  ) {}

  @Post()
  async create(@Body() createPostRequest: CreatePostRequest): Promise<void> {
    await this.postModify.create(createPostRequest);
  }

  @Get()
  async findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('language', new ParseEnumPipe(Language, { optional: true }))
    language: Language = Language.KR,
    @Query('tags') tags?: string,
    @Query('cursor') cursor?: string,
  ): Promise<FindPostsResponse> {
    return await this.postQuery.findAll({ limit, language, tags, cursor });
  }
}
