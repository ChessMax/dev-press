type Html = String;

export interface Site {
    lang: string;
    title: string;
    posts: Array<Post>;
    created: Date;
    description?: string;
    owner: Author;
}

export interface Author {
    name: string;
    github?: string;
}

export interface Post {
    title: string;
    author?: Author;
    content: Html;
    summary?: Html;
    created: Date;
    updated?: Date;
    description: string;
}
