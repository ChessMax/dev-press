import {TemplateEngine} from "./template_engine";
import {Template} from "./template";
import {FileSystem} from "../fs/file_system";
import cons from "consolidate";
import {ViewEngineConfig} from "./view_engine_config";

export class ConsolidateTemplateEngine implements TemplateEngine {
    private engine: any;
    private readonly fs: FileSystem;
    private readonly config: ViewEngineConfig;

    constructor(fs: FileSystem, config: ViewEngineConfig) {
        this.fs = fs;
        this.config = config;
    }

    async initialize(): Promise<void> {
        const { name, config } = this.config;
        let engine = require(name);
        // @ts-ignore
        cons.requires[name] = engine;
        // @ts-ignore
        this.engine = cons[name];

        // engine.config = config;
        for (const prop in config) {
            // @ts-ignore
            engine.config[prop] = config[prop];
        }

        // engine.config.htmlEscape = false;
        // vash.config.settings = {
        //     views: config.views,
        // };
        if (name == 'vash') {
            engine.helpers.echo = (arg: any) => arg.toString();
            engine.helpers.logo = (arg: any) => console.log(arg);
        }
    }

    getTemplate<T>(name: string): Promise<Template<T>> {
        // TODO: generalize
        if (this.fs.extname(name) === '') name += '.vash';
        let views = this.config.views;
        let path = views ? this.fs.join(views, name) : null;
        return new ConsolidateViewTemplate<T>(this.engine, path);
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
        let path = this.path;
        path = './' + path;
        let html = await this.renderer(path, model);
        return html;
    }
}
