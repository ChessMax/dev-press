import {AuthorMeta, SiteMeta} from "../post/post";
import {ViewEngineConfig} from "../view/view_engine_config";
import {ServerConfig} from "../commands/server_config";
import {DirectoryPath, FileName, FilePath, FileSystem} from "../fs/file_system";
import {RecursivePartial} from "./recursive_partial";
import {deepmerge} from "deepmerge-ts";

export interface AppConfig {
    site: SiteMeta;
    author: AuthorMeta;
    theme: DirectoryPath;
    output: DirectoryPath;
    source: DirectoryPath;
    server: ServerConfig;
    viewEngine: ViewEngineConfig;
}

export abstract class Config {
    static async loadAppConfig(fs: FileSystem,
                               configOverride?: RecursivePartial<AppConfig>,
                               name: string = 'config.yaml'): Promise<AppConfig> {
        let defaultConfig = await Config.loadFromPackage<AppConfig>(fs, name);
        let appConfig = await Config.load<AppConfig>(fs, name);
        let config = deepmerge(defaultConfig, appConfig, configOverride ?? {}) as AppConfig;

        return config;
    }

    static async loadFromPackage<T>(fs: FileSystem, path: FilePath): Promise<T> {
        let packageDir = await fs.getPackageDir();
        let config = await Config.load<T>(fs, path, packageDir);
        return config;
    }

    static async load<T>(fs: FileSystem, name: FileName, path?: FilePath): Promise<T> {
        path ??= fs.getCurrentWorkingDir();
        let configPath = fs.join(path, name);
        let config = await fs.loadConfig<T>(configPath);
        return config;
    }
}
