import {glob} from "glob";
import MarkdownIt from "markdown-it";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from 'path'
import {AppConfig} from "../core/app_config";
import hljs from 'highlight.js';
import rimraf from 'rimraf';
import {getTemplate} from "../view/vash/vash_view";
import {Author, Site} from "../post/post";


export async function buildCommand(): Promise<void> {
    let packageDir = __dirname;
    console.log(`packageDir: ${packageDir}`);

    let config = await AppConfig.load('./_config.yaml');

    rimraf.sync(config.output);
    await fse.promises.mkdir(config.output, {recursive: true});

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

    let indexTemplate = await getTemplate<Site>('index');

    let outputDir = config.output;
    let mds = glob.sync('./source/posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = fse.readFileSync(md, 'utf8');
        let body = mdi.render(content);

        let fileName = path.basename(md, '.md');

        let htmlPath = path.join(outputDir, `${fileName}.html`);

        let author: Author = {
            name: 'ChessMax',
            github: 'https://github.com/ChessMax',
        };

        let site = {
            author: author,
            lang: 'ru',
            title: 'Мой Блогъ 2.0',
            created: new Date(2011, 1),
            description: 'Blog description',
            posts: [
                {
                    author: author,
                    title: 'Post title',
                    content: body,
                    description: 'Post description',
                    created: new Date(),
                },
                {
                    author: author,
                    title: 'Post title2',
                    content: body,
                    description: 'Post description 2',
                    created: new Date(),
                },
            ],
        };

        let html = await indexTemplate.render(site);

        fse.writeFileSync(htmlPath, html);

        // fs.cp('./theme/css', outputDir);

        // await fse.copyFile('./theme/css', outputDir);

    }

    await fse.emptydir(path.join(outputDir, 'css'));
    fs.copyFileSync('./theme/index.css', path.join(outputDir, 'css', 'index.css'));
}

