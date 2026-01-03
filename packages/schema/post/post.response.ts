export interface FindPostResponse {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    slug?: string;
    tags: string[];
}

export interface FindPostsItem {
    id: number;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    slug?: string;
    tags: string[];
}

export interface FindPostsResponse {
    posts: FindPostsItem[];
    hasNext: boolean;
    nextCursor?: string;
}
