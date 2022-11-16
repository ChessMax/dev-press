import {Url} from "url";

export interface Layout {
    links: Link[];
}

export interface Link {
    rel: LinkRel;
    type: LinkType;
    href: Url;
}

export type LinkRel = 'stylesheet';
export type LinkType = 'text/css';
