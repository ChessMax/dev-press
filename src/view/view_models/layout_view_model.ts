import {AuthorMeta, Site} from "../../post/post";

export interface LayoutViewModel {
    site: Site;
    author?: AuthorMeta;
    title?: string;
}
