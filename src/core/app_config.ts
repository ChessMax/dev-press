import {Config} from "./config";

export abstract class AppConfig extends Config {
    abstract title: string;
    abstract author: string;
    abstract output: string;
    abstract source: Array<string>;

    public static async load(path: string): Promise<AppConfig> {
        // TODO: default values
        return this.loadConfig<AppConfig>(path);
    }
}
