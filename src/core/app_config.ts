import {Config} from "./config";

export class AppConfig extends Config {
    title: string;
    author: string;
    source: Array<string>;

    constructor(title: string, author: string, source?: Array<string>) {
        super();
        this.title = title;
        this.author = author;
        this.source = source ?? ['./source/posts/*.md'];
    }

    public static async load(path: string): Promise<AppConfig> {
        return this.loadConfig<AppConfig>(path);
    }
}
