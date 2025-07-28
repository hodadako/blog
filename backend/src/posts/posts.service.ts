import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly em: EntityManager) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const post = this.em.create(Post, {
      ...createPostDto,
      publishedAt: createPostDto.publishedAt ? new Date(createPostDto.publishedAt) : undefined,
      isPublished: createPostDto.isPublished ?? false,
    });
    
    await this.em.persistAndFlush(post);
    return post;
  }

  async findAll(): Promise<Post[]> {
    return await this.em.find(Post, {}, { orderBy: { createdAt: 'DESC' } });
  }

  async findPublished(): Promise<Post[]> {
    return await this.em.find(Post, { isPublished: true }, { orderBy: { publishedAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.em.findOne(Post, { id });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.em.findOne(Post, { slug });
    if (!post) {
      throw new NotFoundException(`Post with slug ${slug} not found`);
    }
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    
    this.em.assign(post, {
      ...updatePostDto,
      publishedAt: updatePostDto.publishedAt ? new Date(updatePostDto.publishedAt) : post.publishedAt,
    });
    
    await this.em.flush();
    return post;
  }

  async remove(id: number): Promise<void> {
    const post = await this.findOne(id);
    await this.em.removeAndFlush(post);
  }

  async publish(id: number): Promise<Post> {
    const post = await this.findOne(id);
    post.isPublished = true;
    post.publishedAt = new Date();
    await this.em.flush();
    return post;
  }

  async unpublish(id: number): Promise<Post> {
    const post = await this.findOne(id);
    post.isPublished = false;
    post.publishedAt = undefined;
    await this.em.flush();
    return post;
  }
} 