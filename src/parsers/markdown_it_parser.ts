import {Parser} from "./parser";
import {App} from "../core/app";


export class MarkdownItParser extends Parser {
    async parse(app: App): Promise<void> {
        return Promise.resolve(undefined);
    }

}
