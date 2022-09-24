import {Config} from "./config";
import {FilePath, FileSystem} from "../fs/file_system";

export abstract class AppConfig extends Config {
    abstract title: string;
    abstract author: string;
    abstract output: string;
    abstract source: Array<string>;

    public static async load(fs: FileSystem, path: FilePath): Promise<AppConfig> {
        // TODO: default values
        return this.loadConfig<AppConfig>(fs, path);
    }
}
