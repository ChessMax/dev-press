﻿import {glob} from "glob";
import MarkdownIt from "markdown-it";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import * as fs from "fs";
import * as path from 'path'
import {AppConfig} from "../core/app_config";

export async function buildCommand(): Promise<void> {

    // let frontMatter = await FrontMatter.load<FrontMatter>('front-matter.yaml');

    let config = await AppConfig.load('_config.yml');

    console.log(`title: ${config.title}`);
    console.log(`author: ${config.author}`);
    console.log(`source: ${config.source}`);

    let sources = config.source.flatMap((source) => glob.sync(source));



    let mdi = MarkdownIt({
        html: true,
    }).use(MarkdownItFrontMatter, function(fm){
        console.log(`fm: ${fm}`);
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

