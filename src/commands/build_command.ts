import {glob} from "glob";
import MarkdownIt from "markdown-it";
import * as fs from "fs";
import * as path from 'path'

export async function buildCommand(): Promise<void> {
    let mdi = MarkdownIt({
        html: true,
    });
    let mds = glob.sync('./posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = fs.readFileSync(md, 'utf8');
        let html = mdi.render(content);

        let dir = path.dirname(md);
        let fileName = path.basename(md, '.md');

        let htmlPath = path.join(dir, `${fileName}.html`);

        fs.writeFileSync(htmlPath, html);
    }
}

