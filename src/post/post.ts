import {Site} from "./site";

type Url = string;
type Html = String;

export interface SiteMeta {
    lang: string;
    title: string;
    created: Date;
    description?: string;
    url: string;
}

export interface AuthorMeta {
    name: string;
    github?: string;
}

export interface Post {
    site: Site;
    url: string;
    path: Url;
    title: string;
    author?: AuthorMeta;
    excerpt?: Html;
    content: Html;
    summary?: Html;
    created: Date;
    updated?: Date;
    description?: string;
    tags?: string[];
    urlBuilder: UrlBuilder;
}
