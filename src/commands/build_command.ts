import MarkdownIt from "markdown-it";
import {AppConfig} from "../core/app_config";
import {Post, Site} from "../post/post";
import MarkdownItShiki from "markdown-it-shiki";
import {AppFileSystem} from "../fs/app_file_system";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import {PostViewModel} from "../view/view_models/post_view_model";
import {IndexViewModel} from "../view/view_models/index_view_model";
import {ConsolidateTemplateEngine} from "../view/consolidate_template_engine";
import {parseConfig} from "../core/parse_config";

interface BuildConfig {
    baseUrlOverride?: string;
}

export async function buildCommand(buildConfig?: BuildConfig): Promise<void> {
    let fs = new AppFileSystem();
    let config = await fs.loadConfig<AppConfig>('config.yaml', {
        viewEngine: {
            name: 'vash',
            views: './theme/',
        },
    });

    if (buildConfig && buildConfig.baseUrlOverride != undefined) {
        config.site.url = buildConfig.baseUrlOverride;
    }

    await fs.removeDirRecursive(config.output);
    await fs.makeDirRecursive(config.output);

    let baseUrl = config.site.url;
    let fm: string = '';
    let mdi: MarkdownIt;
    mdi = MarkdownIt({
        html: true,
    }).use(MarkdownItFrontMatter, function (value) {
        fm = value;
    }).use(MarkdownItShiki, {
        theme: 'github-light'
    });

    let siteMeta = config.site;
    let author = config.author;

    siteMeta.created = new Date(siteMeta.created as unknown as string);

    let site: Site = {
        ...siteMeta,
        author: author,
    };

    let posts: Post[] = [];

    let outputDir = config.output;
    let mds = await fs.getGlob('./source/posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = await fs.readTextFile(md);
        let body = mdi.render(content);
        let postMeta = await parseConfig<PostMeta>(fm);

        let r = replaceMore(body);
        let excerpt = r.excerpt;
        body = r.content;

        let fileName = fs.getBaseName(md, '.md');
        let postPath = fs.join(`/posts/${fileName}`);
        let postUrl = fs.join(baseUrl ? baseUrl : '', `/posts/${fileName}.html`);

        posts.push({
                url: postUrl,
                path: postPath,
                author: author,
                title: postMeta.title,
                excerpt: excerpt,
                content: body,
                description: postMeta.description,
                // TODO: adjust time
                created: postMeta.created,
                updated: postMeta.updated,
            }
        );
    }

    // TODO: should be generalized?
    posts.sort((a, b) => b.created.getTime() - a.created.getTime());

    let te = new ConsolidateTemplateEngine(fs, config.viewEngine);
    await te.initialize();

    await fs.copyFile('./theme/css/index.css',
        fs.join(outputDir, 'css', 'index.css'));

    let indexTemplate = await te.getTemplate<IndexViewModel>('index');
    let html = await indexTemplate.render({
        site: site,
        posts: posts,
        author: author,
        isIndex: true,
    });
    let htmlPath = fs.join(outputDir, 'index.html');
    await fs.writeTextFile(htmlPath, html);

    let postTemplate = await te.getTemplate<PostViewModel>('post');

    for (let post of posts) {
        let postHtml = await postTemplate.render({
            site: site,
            post: post,
            author: author,
            isIndex: false,
        });
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
    const excerptTag = /<more\/>/i;

    if (excerptTag.test(content)) {
        content = content.replace(excerptTag, (match, index) => {
            excerpt = content.substring(0, index).trim();
            return '';
        });
    }

    return {
        excerpt: excerpt,
        content: content,
    };
}

interface PostMeta {
    title: string;
    created: Date;
    updated: Date;
    description?: string;
}
