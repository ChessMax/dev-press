import {Template} from "./template";
import {FileSystem} from "../fs/file_system";

export interface TemplateEngine<TConfig> {
    initialize(fs: FileSystem, config: TConfig):Promise<void>;
    getTemplate<TModel>(name: string):Promise<Template<TModel>>;
}
