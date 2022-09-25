import {DirectoryPath, FileExt} from "../fs/file_system";

export interface ViewEngineConfig {
    name: string;
    views: DirectoryPath;
    config?: ViewRendererConfig,
    ext?: FileExt,
}

export interface ViewRendererConfig {

}
