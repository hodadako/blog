import { IsString, IsOptional, IsBoolean, IsArray, IsDateString, Length } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  author?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  slug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
} 