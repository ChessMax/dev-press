import {DirectoryPath} from "../fs/file_system";

export interface ViewEngineConfig {
    name: string;
    views: DirectoryPath;
    config?: ViewRendererConfig,
}

export interface ViewRendererConfig {

}
