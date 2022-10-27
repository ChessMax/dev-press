interface FeedEntry {
    id: string;
    title: string;
    link: string;
    published: Date;
    updated: Date;
    summary: string;
    categories: FeedCategory[];
}
