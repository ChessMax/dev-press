import {ViewEngineConfig} from "../view/view_engine_config";

export interface AppConfig {
    title: string;
    author: string;
    output: string;
    source: Array<string>;
    viewEngine: ViewEngineConfig;
}
