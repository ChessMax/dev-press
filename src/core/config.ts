import * as fs from "fs";
import * as yaml from "js-yaml";

export class Config {
    protected static async loadConfig<T extends Config>(path: string): Promise<T> {
        let content = fs.readFileSync(path, 'utf8');
        let parsedConfig = await yaml.load(content);
        return parsedConfig as T;
    }
}


