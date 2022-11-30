import {AppFileSystem} from "../fs/app_file_system";
import {AppConfig, Config} from "./app_config";
import MarkdownIt from "markdown-it";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import MarkdownItShiki from "markdown-it-shiki";
import {Post} from "../post/post";
import {Site} from "../post/site";
import {Tag} from "../post/tag";
import {parseConfig} from "./parse_config";
import {ConsolidateTemplateEngine} from "../view/consolidate_template_engine";
import path from "path";
import {Feed} from "../post/feed";
import {Template} from "../view/template";
import {Tags} from "../post/tags";
import {FileSystem} from "../fs/file_system";
import {RecursivePartial} from "./recursive_partial";
import {deepmerge} from "deepmerge-ts";
import * as util from "util";
import {AppLogger} from "./app_logger";

export interface DevPressParams {
    fs?: FileSystem;
    config?: RecursivePartial<AppConfig>;
    configName?: string;
}

export class DevPress {
    fs: FileSystem;
    config: AppConfig;

    constructor(config: AppConfig, fs: FileSystem) {
        this.fs = fs;
        this.config = config;
    }

    async build(): Promise<void> {
        let fs = this.fs;
        let config = this.config;

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
            baseUrl: baseUrl,
            urlBuilder: urlBuilder,
        };

        let tagsMap = {} as Record<string, Tag>;

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

            let postTags: Record<string, Tag> = {};
            let post: Post = {
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
                // tags: postTags,
                urlBuilder: urlBuilder,
            };
            posts.push(post);

            // tags

            if (postMeta.tags !== undefined) {
                for (let postTag of postMeta.tags) {
                    let tag = tagsMap[postTag];
                    if (tag !== undefined) {
                        tag.posts.push(post);
                    } else {
                        let encodedTag = encodeURI(postTag);
                        tag = {
                            name: postTag,
                            posts: [post],
                            link: `${baseUrl}/tags/${encodedTag}/`,
                            ref: encodedTag,
                            site: site,
                        };
                        tagsMap[postTag] = tag;
                    }

                    postTags[tag.name] = tag;
                }
            }

            post.tags = Object.values(postTags);

            // end tags
        }

        // TODO: should be generalized?
        posts.sort((a, b) => b.created.getTime() - a.created.getTime());

        let te = new ConsolidateTemplateEngine(fs, config.viewEngine);
        await te.initialize();

        // let cssUrl = `${baseUrl}/css/index.css`;

        async function copyCss(from: string): Promise<void> {
            let name = path.basename(from);
            await fs.copyFile(from, fs.join(outputDir, 'css', name));
        }

        await copyCss('./theme/css/index.css');
        await copyCss('./theme/css/all.min.css');
        await fs.copyFile('./theme/images/favicon.svg',
            fs.join(outputDir, 'images', 'favicon.svg'));

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
                            term: tag.name,
                            // scheme: urlBuilder.getTagUrl(tag)
                            // scheme: `${baseUrl}/tags/${tag.name}`,
                            scheme: tag.link,
                        };
                    }) : [],
                };
            }),
        });
        let feedPath = fs.join(outputDir, `atom.xml`);
        await fs.writeTextFile(feedPath, feedHtml);
        // end

        // tags screen
        async function renderTags(tagsTemplate: Template<Tags>, path: string, tags: Tags): Promise<void> {
            let tagsHtml = await tagsTemplate.render(tags);

            let tagsPath = fs.join(outputDir, path, 'index.html');
            await fs.writeTextFile(tagsPath, tagsHtml);
        }

        let tagsTemplate = await te.getTemplate<Tags>('tags');
        let tagsView = Object.values(tagsMap);

        await renderTags(tagsTemplate, 'tags', {
                title: 'Tags',
                site: site,
                tags: tagsView,
            }
        );

        for (let tag of tagsView) {
            await renderTags(tagsTemplate, `tags/${tag.name}`, {
                    title: tag.name,
                    site: site,
                    tags: [tag],
                }
            );
        }
    }

    static async initialize(params?: DevPressParams): Promise<DevPress> {
        let fs = params?.fs ?? new AppFileSystem();
        let config = await Config.loadAppConfig(fs, params?.config);

        AppLogger.logInspect('config', config);

        return new DevPress(config, fs);
    }
}

interface PostMeta {
    title: string;
    created: Date;
    updated: Date;
    description?: string;
    tags?: string[];
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
