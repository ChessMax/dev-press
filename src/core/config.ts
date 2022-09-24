import * as yaml from "js-yaml";
import {FilePath, FileSystem} from "../fs/file_system";

export class Config {
    protected static async loadConfig<T extends Config>(fs: FileSystem, path: FilePath): Promise<T> {
        let content = await fs.readTextFile(path);
        let parsedConfig = await yaml.load(content);
        return parsedConfig as T;
    }
}


