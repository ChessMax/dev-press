import {AuthorMeta, Post} from "./post";

export interface Site {
    lang: string;
    title: string;
    created: Date;
    posts: Post[];
    author: AuthorMeta;
    description?: string;
    urlBuilder: UrlBuilder;
    baseUrl?: string;
}
