﻿import {glob} from "glob";
import MarkdownIt from "markdown-it";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import * as fs from "fs";
import * as path from 'path'
import {AppConfig} from "../core/app_config";
import hljs from 'highlight.js';
import rimraf from 'rimraf';

export async function buildCommand(): Promise<void> {
    let packageDir = __dirname;
    console.log(`packageDir: ${packageDir}`);

    let config = await AppConfig.load('./_config.yaml');

    rimraf.sync(config.output);
    await fs.promises.mkdir(config.output, {recursive: true});

    console.log(`title: ${config.title}`);
    console.log(`author: ${config.author}`);
    console.log(`source: ${config.source}`);
    console.log(`output: ${config.output}`);

    // let sources = config.source.flatMap((source) => glob.sync(source));
    //
    // for (const source of sources) {
    //     console.log(`source: ${source}`);
    // }

    let mdi: MarkdownIt;
    mdi = MarkdownIt({
        html: true,
        highlight: function (str, lang) {
            let code: string | null = null;
            if (lang && hljs.getLanguage(lang)) {
                try {
                    code = hljs.highlight(str, {language: lang, ignoreIllegals: true}).value;
                } catch (_) {
                }
            }
            code ||= mdi.utils.escapeHtml(str);
            return `<pre class="hljs"><code>${code}</code></pre>`;
        }
    }).use(MarkdownItFrontMatter, function (fm) {
        console.log(`fm: ${fm}`);
    });

    let postViewPath = './theme/index.vash';
    let layoutViewPath = './theme/layout.vash';
    let layoutViewContent = fs.readFileSync(layoutViewPath, 'utf8');
    let postViewContent = fs.readFileSync(postViewPath, 'utf8');

    let vash = require('vash');
    vash.config.htmlEscape = false;
    vash.config.settings = {
        views: path.join(process.cwd(), './theme'),
    };
    let l = vash.install('layout', layoutViewContent);
    let i = vash.install('index', postViewContent);
    let postHtmlTemplate = vash.lookup('index');// vash.compile(postViewContent);

    let outputDir = config.output;

    let mds = glob.sync('./source/posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = fs.readFileSync(md, 'utf8');
        let body = mdi.render(content);

        let fileName = path.basename(md, '.md');

        let htmlPath = path.join(outputDir, `${fileName}.html`);

        postHtmlTemplate({
            author: {
                name: 'ChessMax',
                github: 'https://github.com/ChessMax',
            },
            lang: 'ru',
            posts: [{
                title: 'Post title',
                content: body,
                description: 'Blog description',
            },
            ],
        }, (_: any, ctx: { finishLayout: () => String; }) => {
            let html = ctx.finishLayout();
            fs.writeFileSync(htmlPath, html);

            fs.copyFileSync('./theme/index.css', path.join(outputDir, 'index.css'));
        });


    }
}

