import {glob} from "glob";
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

    let vash = require('vash');
    vash.config.htmlEscape = false;

    let config = await AppConfig.load('./_config.yaml');

    rimraf.sync(config.output);
    await fs.promises.mkdir(config.output, { recursive: true });

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

    let postViewPath = './theme/index.jshtml';
    let postViewContent = fs.readFileSync(postViewPath, 'utf8');
    let postHtmlTemplate = vash.compile(postViewContent);

    let outputDir = config.output;

    let mds = glob.sync('./source/posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = fs.readFileSync(md, 'utf8');
        let body = mdi.render(content);

        let fileName = path.basename(md, '.md');

        let htmlPath = path.join(outputDir, `${fileName}.html`);

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

