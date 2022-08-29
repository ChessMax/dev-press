import * as yaml from "js-yaml";
import * as fs from "fs";

export class Config {
    public static async load<T extends Config>(path: string):Promise<T> {
        let content = fs.readFileSync(path,  'utf8');
        let parsedConfig = await yaml.load(content);
        return parsedConfig as T;
    }
}
