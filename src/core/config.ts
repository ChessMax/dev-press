import * as fs from "fs";
import * as yaml from "js-yaml";

export class Config {
    protected static async loadConfig<T extends Config>(path: string): Promise<T> {
        let content = fs.readFileSync(path, 'utf8');
        let parsedConfig = await yaml.load(content);
        return parsedConfig as T;
    }
}

export class AppConfig extends Config {
    title: string;
    author: string;

    constructor(title: string, author: string) {
        super();
        this.title = title;
        this.author = author;
    }

    public static async load(path: string): Promise<AppConfig> {
        return this.loadConfig<AppConfig>(path);
    }
}
