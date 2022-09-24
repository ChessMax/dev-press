import {Template} from "../template";
import {FileSystem} from "../../fs/file_system";

type VashOnRenderEnd = (err: any, ctx: { finishLayout: () => string; }) => void;
type VashTemplate = (model: any, onRenderEnd: VashOnRenderEnd) => void;

export async function getTemplate<T>(myFs:FileSystem, name: string): Promise<Template<T>> {
    let vash = require('vash');
    vash.config.htmlEscape = false;
    vash.config.settings = {
        views: myFs.join(myFs.getCurrentWorkingDir(), './theme'),
    };
    vash.helpers.echo = (arg: any) => arg.toString();
    vash.helpers.logo = (arg: any) => console.log(arg);

    let paths = [
        './theme/post.vash',
        './theme/index.vash',
        './theme/layout.vash',
    ];

    for (let viewPath of paths) {
        let viewContent = await myFs.readTextFile(viewPath);
        let viewName = myFs.getBaseName(viewPath, '.vash');
        vash.install(viewName, viewContent);
    }

    let template = vash.lookup(name);
    return new VashViewTemplate<T>(template);
}

class VashViewTemplate<T> implements Template<T> {
    private readonly template: VashTemplate;

    constructor(template: VashTemplate) {
        this.template = template;
    }

    render(model: T): Promise<string> {
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
