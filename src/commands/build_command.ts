﻿import {glob} from "glob";
import MarkdownIt from "markdown-it";
import * as fs from "fs";
import * as path from 'path'
import {FrontMatter} from "../core/front_matter";

export async function buildCommand(): Promise<void> {

    let frontMatter = await FrontMatter.load<FrontMatter>('front-matter.yaml');

    console.log(`title: ${frontMatter.title}`);

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

