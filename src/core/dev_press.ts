import {AppFileSystem} from "../fs/app_file_system";
import {AppConfig, Config} from "./app_config";
import {Post} from "../post/post";
import {Site} from "../post/site";
import {Tag} from "../post/tag";
import {parseConfig} from "./parse_config";
import {ConsolidateTemplateEngine} from "../view/consolidate_template_engine";
import {Feed} from "../post/feed";
import {Template} from "../view/template";
import {Tags} from "../post/tags";
import {DirectoryPath, FileSystem} from "../fs/file_system";
import {RecursivePartial} from "./recursive_partial";
import {PostMeta} from "../post/post_meta";
import {PluginConfig} from "../plugin/plugin_config";
import {StringHelpers} from "../string_helpers";
import {getGitCreatedTime, getGitLastUpdatedTime} from "./helpers/git_time";
import {stripHtml} from "string-strip-html";

export interface DevPressParams {
    fs?: FileSystem;
    config?: RecursivePartial<AppConfig>;
}

export type RenderResult = [content: string, meta: string];

export type Renderer = (content: string, env?: any) =>
    RenderResult | Promise<RenderResult>;
export type StaticFilesRenderer = (outputDir: DirectoryPath) => Promise<void>;
export type BeforeRenderer = (value: Post | Site) => void | Promise<void>;

export class DevPress {
    fs: FileSystem;
    config: AppConfig;
    renderers: Record<string, Renderer> = {};
    staticFileRenderers: StaticFilesRenderer[] = [];
    beforeRenderers: BeforeRenderer[] = [];

    constructor(config: AppConfig, fs: FileSystem) {
        this.fs = fs;
        this.config = config;
    }

    getConfigByName(name: string): PluginConfig | null {
        let dynamicConfig = this.config as any;
        let config = dynamicConfig[name] as PluginConfig;
        return config;
    }

    async invokeBeforeRender(value: Post | Site): Promise<void> {
        for (let renderer of this.beforeRenderers) {
            await renderer(value);
        }
    }

    async render(name: string, content: string, env?: any): Promise<RenderResult> {
        let renderer = this.renderers[name];
        let result = await renderer(content, env);
        return result;
    }

    async build(): Promise<void> {
        let fs = this.fs;
        let config = this.config;

        await fs.removeDirRecursive(config.output);
        await fs.makeDirRecursive(config.output);

        let baseUrl = config.site.url;
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
            bodyEnd: [],
        };

        let tagsMap = {} as Record<string, Tag>;

        let outputDir = config.output;
        let mds = await fs.getGlob('./source/posts/*.md');
        for (const md of mds) {
            console.log(`md: ${md}`);

            let content = await fs.readTextFile(md);
            let [body, meta] = await this.render('markdown', content!);
            let postMeta = await parseConfig<PostMeta>(meta);

            if (postMeta.hidden == true) {
                continue;
            }

            if (postMeta.created == null) {
                postMeta.created = getGitCreatedTime(md);
            }

            if (postMeta.updated == null) {
                postMeta.updated = getGitLastUpdatedTime(md);
            }

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
                created: postMeta.created ?? new Date(),
                updated: postMeta.updated ?? new Date(),
                // tags: postTags,
                urlBuilder: urlBuilder,
                bodyEnd: [],
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

        await Promise.all<void>(this.staticFileRenderers.map((r) => r(outputDir)));

        let te = new ConsolidateTemplateEngine(fs, config.viewEngine);
        await te.initialize();
        await this.invokeBeforeRender(site);
        let indexTemplate = await te.getTemplate<Site>('index');
        let html = await indexTemplate.render(site);
        let htmlPath = fs.join(outputDir, 'index.html');
        await fs.writeTextFile(htmlPath, html);

        let postTemplate = await te.getTemplate<Post>('post');

        for (let post of posts) {
            await this.invokeBeforeRender(post);

            let postHtml = await postTemplate.render(post);
            let postPath = fs.join(outputDir, `${post.path}.html`);
            await fs.writeTextFile(postPath, postHtml);
        }

        // TODO: move to its own plugin?
        let feedTemplate = await te.getTemplate<Feed>('feed');
        let feedHtml = await feedTemplate.render({
            title: site.title,
            selfLink: new URL('atom.xml', baseUrl).toString(),
            link: baseUrl,
            updated: new Date(),
            id: new URL(baseUrl).toString(),
            author: site.author,
            entries: posts.map((post) => {
                let tags = post.tags;
                let summary = stripHtml(post.intro || post.content).result.substring(0, 500);
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
        // AppLogger.logInspect('config', config);

        let app = new DevPress(config, fs);

        let loadPlugin = async (fullName: string): Promise<void> => {
            let name = fs.getBaseName(fullName);
            let nameWithoutExt = name.replace('_plugin.js', '');
            let camelCaseName = StringHelpers.snakeCaseToCamelCase(nameWithoutExt);
            let pluginConfig = app.getConfigByName(camelCaseName);
            if (pluginConfig != null && pluginConfig.enabled == false) {
                console.log(`Plugin '${nameWithoutExt}' is disabled. Skip loading.`);
                return;
            }
            // console.log(`Loading plugin '${nameWithoutExt}'...`);
            let plugin = require(`../plugin/${name}`);
            await plugin.initialize(app);
            console.log(`Plugin '${nameWithoutExt}' loaded.`);
        }

        let packageDir = await fs.getPackageDir();
        let plugins = await fs.getGlob('./lib/src/plugin/*_plugin.js', {cwd: packageDir});

        for (let pluginName of plugins) {
            await loadPlugin(pluginName);
        }

        // TODO: loading scripts
        // TODO: try to load ts scripts?

        return app
    }
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

    // TODO: need generic fix
    const imgTag = /<img src=".+?"/i;
    intro = intro.replace(imgTag, (match, index) => {
        let url = match.replace('\./', './posts/');
        return url;
    });

    return {
        intro: intro,
        content: content,
    };
}
