export interface PostMeta {
    title: string;
    created: Date | null;
    updated: Date | null;
    description?: string;
    tags?: string[];
}
