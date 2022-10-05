type Url = string;
type Html = String;

export interface SiteMeta {
    lang: string;
    title: string;
    created: Date;
    description?: string;
    url: string;
}

export interface Site {
    lang: string;
    title: string;
    created: Date;
    author: AuthorMeta;
    description?: string;
}

export interface AuthorMeta {
    name: string;
    github?: string;
}

export interface Post {
    url: string;
    path: Url;
    title: string;
    author?: AuthorMeta;
    excerpt?: Html;
    content: Html;
    summary?: Html;
    created: Date;
    updated?: Date;
    description: string;
}
