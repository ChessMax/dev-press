type Url = string;
type Html = String;

export interface Site {
    lang: string;
    title: string;
    post?:Post;
    posts: Array<Post>;
    created: Date;
    author: Author;
    description?: string;
}

export interface Author {
    name: string;
    github?: string;
}

export interface Post {
    url: string;
    path: Url;
    title: string;
    author?: Author;
    excerpt?: Html;
    content: Html;
    summary?: Html;
    created: Date;
    updated?: Date;
    description: string;
}
