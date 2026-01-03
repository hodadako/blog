import { FindPostsResponse } from '@schema/post';
import { Language } from '@backend/common';

export abstract class PostQuery {
  abstract findAll(query: FindPostsParams): Promise<FindPostsResponse>;
}

export interface FindPostsParams {
  limit: number;
  language: Language;
  tags?: string;
  cursor?: string;
}
