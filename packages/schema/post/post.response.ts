export interface FindPostResponse {
    id: number;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    slug?: string;
    tags: string[];
}

export interface FindPostsItem {
    id: number;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    slug?: string;
    tags: string[];
}

export interface FindPostsResponse {
    posts: FindPostsItem[];
    hasNextPage: boolean;
    nextCursor?: number;
    totalCount: number;
}
