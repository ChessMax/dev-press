import {Post} from "./post";
import {Site} from "./site";

export interface Tag {
    name: string;
    link: string;
    ref: string;
    posts: Post[];
    site: Site;
}
