import {AuthorMeta, SiteMeta} from "../post/post";
import {ViewEngineConfig} from "../view/view_engine_config";

export interface AppConfig {
    site: SiteMeta;
    author: AuthorMeta;
    output: string;
    viewEngine: ViewEngineConfig;
}
