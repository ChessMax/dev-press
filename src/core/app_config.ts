import {Config} from "./config";

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
