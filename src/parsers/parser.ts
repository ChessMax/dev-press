import {App} from "../core/app";

export abstract class Parser {
    public abstract parse(app: App): Promise<void>;
}
