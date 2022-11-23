import {AuthorMeta, SiteMeta} from "../post/post";
import {ViewEngineConfig} from "../view/view_engine_config";
import {ServerConfig} from "../commands/server_config";
import {FilePath, FileSystem} from "../fs/file_system";

export interface AppConfig {
    site: SiteMeta;
    author: AuthorMeta;
    output: string;
    server: ServerConfig;
    viewEngine: ViewEngineConfig;
}

export abstract class Config {
    static async loadAppConfig(fs: FileSystem, name: string = 'config.yaml'):Promise<AppConfig> {
        let config = await Config.load<AppConfig>(fs, name);
        return config;
    }
    static async load<T>(fs: FileSystem, path: FilePath):Promise<T> {
        let packageDir = await fs.getPackageDir();
        let defaultConfig = await fs.loadConfig<T>(fs.join(packageDir, path));
        let config = await fs.loadConfig<T>(fs.join(fs.getCurrentWorkingDir(), path), defaultConfig);
        return config;
    }
}
