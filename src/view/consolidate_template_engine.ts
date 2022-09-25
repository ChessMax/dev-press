import {TemplateEngine} from "./template_engine";
import {Template} from "./template";
import {DirectoryPath, FilePath, FileSystem} from "../fs/file_system";
import cons from "consolidate";

type ConsolidateTemplateEngineConfig = {
    views: DirectoryPath,
};

export class ConsolidateTemplateEngine implements TemplateEngine<ConsolidateTemplateEngineConfig> {
    private vash: any;
    private fs: FileSystem;
    private config: ConsolidateTemplateEngineConfig;

    async initialize(fs: FileSystem, config: ConsolidateTemplateEngineConfig): Promise<void> {
        this.fs = fs;
        this.config = config;

        let vash = require('vash');
        cons.requires.vash = vash;
        this.vash = cons.vash;

        vash.config.htmlEscape = false;
        // vash.config.settings = {
        //     views: config.views,
        // };
        vash.helpers.echo = (arg: any) => arg.toString();
        vash.helpers.logo = (arg: any) => console.log(arg);
    }

    getTemplate<T>(name: string): Promise<Template<T>> {
        // TODO: generalize
        if (this.fs.extname(name) === '') name += '.vash';
        let path = this.fs.join(this.config.views, name);
        return new ConsolidateViewTemplate<T>(this.vash, path);
    }
}

type ConsolidateRender<TOptions> = (path: string, options: TOptions) => Promise<string>;

class ConsolidateViewTemplate<T> implements Template<T> {
    path: string;
    renderer: ConsolidateRender<any>;

    constructor(renderer: ConsolidateRender<any>, path: string) {
        this.path = path;
        this.renderer = renderer;
    }

    async render(model: T): Promise<string> {
        let html = await this.renderer(this.path, model);
        return html;
    }
}
