import MarkdownIt from "markdown-it";
import {AppConfig} from "../core/app_config";
import {Post} from "../post/post";
import {Site} from "../post/site";
import MarkdownItShiki from "markdown-it-shiki";
import {AppFileSystem} from "../fs/app_file_system";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import {ConsolidateTemplateEngine} from "../view/consolidate_template_engine";
import {parseConfig} from "../core/parse_config";
import {Feed} from "../post/feed";

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

    let highlight = mdi.options.highlight!;
    mdi.options.highlight = (code, lang, attrs) => {
        code = code.trimEnd();
        let lines = code.split(/\r?\n/);
        let spacesPerLine = lines
            .filter((line) => line.trim().length > 0)
            .map((line) => line.length - line.trimStart().length);
        let commonSpaceWidth = Math.min(...spacesPerLine);
        if (commonSpaceWidth > 0) {
            code = lines.map((line) => line.substring(commonSpaceWidth)).join('\n');
        }
        let highlighted = highlight(code, lang, attrs);
        return highlighted;
    };

    let siteMeta = config.site;
    let author = config.author;

    siteMeta.created = new Date(siteMeta.created as unknown as string);

    let posts: Post[] = [];

    let urlBuilder: UrlBuilder = {
        getTagUrl(tag: string): string {
            return `./tags/${tag}`;
        }
    };

    let site: Site = {
        ...siteMeta,
        posts: posts,
        author: author,
        urlBuilder: urlBuilder,
    };

    let outputDir = config.output;
    let mds = await fs.getGlob('./source/posts/*.md');
    for (const md of mds) {
        console.log(`md: ${md}`);

        let content = await fs.readTextFile(md);
        let body = mdi.render(content);
        let postMeta = await parseConfig<PostMeta>(fm);

        let r = replaceMore(body);
        let intro = r.intro;
        body = r.content;

        let fileName = fs.getBaseName(md, '.md');
        let postPath = fs.join(`/posts/${fileName}`);
        // let postUrl = fs.join(baseUrl ? baseUrl : '', `/posts/${fileName}.html`);
        // TODO: join breaks url for some reason(
        if (baseUrl === undefined || baseUrl == null) {
            baseUrl = '';
        }

        let postUrl = `${baseUrl}/posts/${fileName}.html`;

        let postTitle = postMeta.title;

        posts.push({
                site: site,
                url: postUrl,
                path: postPath,
                author: author,
                title: postTitle,
                intro: intro,
                content: body,
                description: postMeta.description,
                // TODO: adjust time
                created: postMeta.created,
                updated: postMeta.updated,
                tags: postMeta.tags,
                urlBuilder: urlBuilder,
            }
        );
    }

    // TODO: should be generalized?
    posts.sort((a, b) => b.created.getTime() - a.created.getTime());

    let te = new ConsolidateTemplateEngine(fs, config.viewEngine);
    await te.initialize();

    await fs.copyFile('./theme/css/index.css',
        fs.join(outputDir, 'css', 'index.css'));

    // TODO: fix explicit file copy
    await fs.copyFile('./source/posts/step_on_a_rake.png',
        fs.join(outputDir, 'posts', 'step_on_a_rake.png'));

    let indexTemplate = await te.getTemplate<Site>('index');
    let html = await indexTemplate.render(site);
    let htmlPath = fs.join(outputDir, 'index.html');
    await fs.writeTextFile(htmlPath, html);

    let postTemplate = await te.getTemplate<Post>('post');

    for (let post of posts) {
        let postHtml = await postTemplate.render(post);
        let postPath = fs.join(outputDir, `${post.path}.html`);
        await fs.writeTextFile(postPath, postHtml);
    }

    // TODO: move to its own plugin?
    let feedTemplate = await te.getTemplate<Feed>('feed');
    let feedHtml = await feedTemplate.render({
        title: site.title,
        selfLink: `${baseUrl}/atom.xml`,
        link: baseUrl,
        updated: new Date(),
        id: baseUrl,
        author: site.author,
        entries: posts.map((post) => {
            let tags = post.tags;
            let summary = (post.intro || post.content).substring(0, 140);
            return {
               title: post.title,
               link: post.url,
               id: post.url,
               published: post.created,
               updated: post.updated ?? new Date(),
               summary: summary,
               categories: tags ? tags.map((tag) => {
                   return {
                       term: tag,
                       // scheme: urlBuilder.getTagUrl(tag)
                       scheme: `${baseUrl}/tags/${tag}`,
                   };
               }) : [],
            };
        }),
    });
    let feedPath = fs.join(outputDir, `atom.xml`);
    await fs.writeTextFile(feedPath, feedHtml);
    // end
}

// TODO: make plugin?
function replaceMore(content: string): {
    intro: string,
    content: string
} {
    let intro: string = '';
    const excerptTag = /<more\/>/i;

    if (excerptTag.test(content)) {
        content = content.replace(excerptTag, (match, index) => {
            intro = content.substring(0, index).trim();
            return '';
        });
    }

    return {
        intro: intro,
        content: content,
    };
}

interface PostMeta {
    title: string;
    created: Date;
    updated: Date;
    description?: string;
    tags?: string[];
}
