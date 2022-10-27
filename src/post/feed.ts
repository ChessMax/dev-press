import {AuthorMeta} from "./post";

export interface Feed {
    title: string;
    icon?: string;
    selfLink: string;
    link: string;
    updated: Date;
    id: string;
    // TODO: support authors
    author: AuthorMeta;
    // TODO: generator
    // generator: {
    // };
    entries: FeedEntry[];
}
