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
import {Author, Post, Site} from "../post/post";
import {PostViewModel} from "../view/post_view_model";


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

    let baseUrl = '/dev-press/';// '/dev-press/example/public/';

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

    let author: Author = {
        name: 'ChessMax',
        github: 'https://github.com/ChessMax',
    };
    let site: Site = {
        author: author,
        lang: 'ru',
        title: 'Мой Блогъ 2.0',
        created: new Date(2011, 1),
        description: 'Blog description',
        posts: []
    };
    let posts = site.posts;

    let outputDir = config.output;
    let mds = glob.sync('./source/posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = fse.readFileSync(md, 'utf8');
        let body = mdi.render(content);

        let r = replaceMore(body);
        let excerpt = r.excerpt;
        body = r.content;

        let fileName = path.basename(md, '.md');
        let postPath = path.join(`/posts/${fileName}`);
        let postUrl = path.join(baseUrl, `/posts/${fileName}.html`);

        posts.push({
                url: postUrl,
                path: postPath,
                author: author,
                title: 'Post title',
                excerpt: excerpt,
                content: body,
                description: 'Post description',
                created: new Date(),
            }
        );
    }

    await fse.emptydir(path.join(outputDir, 'css'));
    fs.copyFileSync('./theme/css/index.css', path.join(outputDir, 'css', 'index.css'));

    let indexTemplate = await getTemplate<Site>('index');
    let html = await indexTemplate.render(site);
    let htmlPath = path.join(outputDir, 'index.html');
    fse.outputFileSync(htmlPath, html);

    let postTemplate = await getTemplate<Site>('post');

    for (let post of posts) {
        site.post = post;
        let postHtml = await postTemplate.render(site);
        let postPath = path.join(outputDir, `${post.path}.html`);
        fse.outputFileSync(postPath, postHtml);
    }
}

// TODO: make plugin?
function replaceMore(content: string): {
    excerpt: string,
    content: string
} {
    let excerpt: string = '';
    let more: string = content;
    const rExcerpt = /<!-- ?more ?-->/i;

    if (rExcerpt.test(content)) {
        content = content.replace(rExcerpt, (match, index) => {
            excerpt = content.substring(0, index).trim();
            more = content.substring(index + match.length).trim();

            return '<span id="more">далее...</span>';
        });
    }

    // console.log(`excerpt: ${excerpt}`);
    // console.log(`more: ${more}`);

    return {
        excerpt: excerpt,
        content: more,
    };
}

