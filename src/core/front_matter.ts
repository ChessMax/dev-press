import {Config} from "./config";

export class FrontMatter extends Config {
    title: string;

    constructor(title:string) {
        super();
        this.title = title;
    }
}
