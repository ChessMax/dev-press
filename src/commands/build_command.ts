import MarkdownIt from "markdown-it";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import {AppConfig} from "../core/app_config";
import {getTemplate} from "../view/vash/vash_view";
import {Author, Post, Site} from "../post/post";
import {PostViewModel} from "../view/post_view_model";
import MarkdownItShiki from "markdown-it-shiki";
import {AppFileSystem} from "../fs/app_file_system";

export async function buildCommand(): Promise<void> {
    let fs = new AppFileSystem();
    let packageDir = fs.getPackageDir();
    console.log(`packageDir: ${packageDir}`);

    let config = await AppConfig.load(fs, './_config.yaml');

    await fs.removeDirRecursive(config.output);
    await fs.makeDirRecursive(config.output);

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
    let mds = await fs.getGlob('./source/posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = await fs.readTextFile(md);
        let body = mdi.render(content);

        let r = replaceMore(body);
        let excerpt = r.excerpt;
        body = r.content;

        let fileName = fs.getBaseName(md, '.md');
        let postPath = fs.join(`/posts/${fileName}`);
        let postUrl = fs.join(baseUrl, `/posts/${fileName}.html`);

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

    await fs.copyFile('./theme/css/index.css',
        fs.join(outputDir, 'css', 'index.css'));

    let indexTemplate = await getTemplate<Site>(fs, 'index');
    let html = await indexTemplate.render(site);
    let htmlPath = fs.join(outputDir, 'index.html');
    await fs.writeTextFile(htmlPath, html);

    let postTemplate = await getTemplate<Site>(fs, 'post');

    for (let post of posts) {
        site.post = post;
        post.isIndex = false;
        let postHtml = await postTemplate.render(site);
        let postPath = fs.join(outputDir, `${post.path}.html`);
        await fs.writeTextFile(postPath, postHtml);
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

