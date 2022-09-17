import path from "path";
import * as fse from "fs-extra";
import {Template} from "../template";

type VashOnRenderEnd = (err: any, ctx: { finishLayout: () => string; }) => void;
type VashTemplate = (model: any, onRenderEnd: VashOnRenderEnd) => void;

// type VashTemplate = (model: any, (_: any, ctx: { finishLayout: () => string; })) => void;// => template(model, (_: any, ctx: { finishLayout: () => string; }) =>


export async function getTemplate<T>(name: string): Promise<Template<T>> {
    let postViewPath = './theme/index.vash';
    let layoutViewPath = './theme/layout.vash';
    let layoutViewContent = fse.readFileSync(layoutViewPath, 'utf8');
    let postViewContent = fse.readFileSync(postViewPath, 'utf8');

    let vash = require('vash');
    vash.config.htmlEscape = false;
    vash.config.settings = {
        views: path.join(process.cwd(), './theme'),
    };
    vash.helpers.echo = (arg: any) => arg.toString();

    vash.install('layout', layoutViewContent);
    vash.install('index', postViewContent);

    let template = vash.lookup('index');
    return new VashViewTemplate<T>(template);
}

class VashViewTemplate<T> implements Template<T> {
    private readonly template: VashTemplate;

    constructor(template: VashTemplate) {
        this.template = template;
    }

    render(model: T): Promise<string> {
        // return Promise.resolve("");
        return new Promise(async (resolve, reject) => {
            try {
                this.template(model, (_, ctx) => {
                    let html = ctx.finishLayout();
                    resolve(html);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

}
