import {DevPress, StaticFilesRenderer} from "../core/dev_press";
import path from "path";

export function initialize(context: DevPress) {
    let staticFilesRenderer: StaticFilesRenderer = async (outputDir) => {
        // let cssUrl = `${baseUrl}/css/index.css`;
        let fs = context.fs;
        async function copyCss(from: string): Promise<void> {
            let name = path.basename(from);
            await fs.copyFile(from, fs.join(outputDir, 'css', name));
        }

        await copyCss('./theme/css/index.css');
        await copyCss('./theme/css/all.min.css');
        await fs.copyFile('./theme/images/favicon.svg',
            fs.join(outputDir, 'images', 'favicon.svg'));

        // TODO: fix explicit file copy
        await fs.copyFile('./source/posts/step_on_a_rake.png',
            fs.join(outputDir, 'posts', 'step_on_a_rake.png'));
    };
    context.staticFileRenderers.push(staticFilesRenderer);
}
