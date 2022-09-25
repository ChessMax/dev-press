import {Template} from "./template";

export interface TemplateEngine {
    initialize(): Promise<void>;

    getTemplate<TModel>(name: string): Promise<Template<TModel>>;
}
