import {Site} from "./site";
import {Tag} from "./tag";

export interface Tags {
    title: string;
    site: Site;
    tags: Tag[];
}
