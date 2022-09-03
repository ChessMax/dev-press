import {App} from "../core/app";

export interface Plugin {
    initialize(app: App):Promise<void>;
}
