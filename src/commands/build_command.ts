import MarkdownIt from "markdown-it";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import {AppConfig} from "../core/app_config";
import {getTemplate} from "../view/vash/vash_view";
import {Author, Post, Site} from "../post/post";
import {PostViewModel} from "../view/post_view_model";
import MarkdownItShiki from "markdown-it-shiki";
import {AppFileSystem} from "../fs/app_file_system";

export async function buildCommand(): Promise<void> {
    let myFs = new AppFileSystem();
    let packageDir = myFs.getPackageDir();
    console.log(`packageDir: ${packageDir}`);

    let config = await AppConfig.load(myFs, './_config.yaml');

    await myFs.removeDirRecursive(config.output);
    await myFs.makeDirRecursive(config.output);

    console.log(`title: ${config.title}`);
    console.log(`author: ${config.author}`);
    console.log(`source: ${config.source}`);
    console.log(`output: ${config.output}`);

    let baseUrl = '/dev-press/';

    let mdi: MarkdownIt;
    mdi = MarkdownIt({
        html: true,
    }).use(MarkdownItFrontMatter, function (fm) {
        console.log(`fm: ${fm}`);
    }).use(MarkdownItShiki, {
        theme: 'github-light'
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
    let mds = await myFs.getGlob('./source/posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = await myFs.readTextFile(md);
        let body = mdi.render(content);

        let r = replaceMore(body);
        let excerpt = r.excerpt;
        body = r.content;

        let fileName = myFs.getBaseName(md, '.md');
        let postPath = myFs.join(`/posts/${fileName}`);
        let postUrl = myFs.join(baseUrl, `/posts/${fileName}.html`);

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

    await myFs.makeDirRecursive(myFs.join(outputDir, 'css'));
    await myFs.copyFile('./theme/css/index.css',
        myFs.join(outputDir, 'css', 'index.css'));

    let indexTemplate = await getTemplate<Site>('index');
    let html = await indexTemplate.render(site);
    let htmlPath = myFs.join(outputDir, 'index.html');
    await myFs.writeTextFile(htmlPath, html);

    let postTemplate = await getTemplate<Site>('post');

    for (let post of posts) {
        site.post = post;
        post.isIndex = false;
        let postHtml = await postTemplate.render(site);
        let postPath = myFs.join(outputDir, `${post.path}.html`);
        await myFs.writeTextFile(postPath, postHtml);
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

