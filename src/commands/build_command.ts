import {glob} from "glob";
import MarkdownIt from "markdown-it";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import * as fs from "fs";
import * as path from 'path'
import {AppConfig} from "../core/app_config";
import hljs from 'highlight.js';

export async function buildCommand(): Promise<void> {

    // let html = hljs.highlight("<span>Hello World!</span>", {language: "html"}).value;
    // console.log(html);

    // let frontMatter = await FrontMatter.load<FrontMatter>('front-matter.yaml');
    let vash = require('vash');
    vash.config.htmlEscape = false;
    //
    // let tpl = vash.compile('<p>I am a @model.t!</p>');
    //
    // let out = tpl({t: 'template'});
    //
    // console.log(`out: ${out}`);
    //
    // let config = await AppConfig.load('./_config.yaml');
    //
    // console.log(`title: ${config.title}`);
    // console.log(`author: ${config.author}`);
    // console.log(`source: ${config.source}`);
    //
    // let sources = config.source.flatMap((source) => glob.sync(source));
    //
    // for (const source of sources) {
    //     console.log(`source: ${source}`);
    // }
    //
    let mdi = MarkdownIt({
        html: true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return '<pre class="hljs"><code>' +
                        hljs.highlight(str, {language: lang, ignoreIllegals: true}).value +
                        '</code></pre>';
                } catch (__) {
                }
            }

            return '<pre class="hljs"><code>' + mdi.utils.escapeHtml(str) + '</code></pre>';
        }
    }).use(MarkdownItFrontMatter, function (fm) {
        console.log(`fm: ${fm}`);
    });
    //
    // let code = '```js let js = "my-js";```';
    // let v = mdi.render(code);
    // console.log(`v: ${v}`);

    let postViewPath = './theme/index.jshtml';
    let postViewContent = fs.readFileSync(postViewPath, 'utf8');
    let postHtmlTemplate = vash.compile(postViewContent);

    let mds = glob.sync('./source/posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = fs.readFileSync(md, 'utf8');
        let body = mdi.render(content);

        let dir = path.dirname(md);
        let fileName = path.basename(md, '.md');

        let htmlPath = path.join(dir, `${fileName}.html`);

        let html = postHtmlTemplate({
            lang: 'ru',
            author: 'ChessMax',
            title: 'Post title',
            description: 'Blog description',
            body: body,
        });

        fs.writeFileSync(htmlPath, html);
    }
}

