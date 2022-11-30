import {DevPress} from "../core/dev_press";
import MarkdownIt from "markdown-it";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import MarkdownItShiki from "markdown-it-shiki";

export function initialize(context: DevPress): void {
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
        // TODO: should highlight be placed inside it's own plugin?
        let highlighted = highlight(code, lang, attrs);
        return highlighted;
    };

    context.renderers['markdown'] = (content: string, env?: any) => {
        let body = mdi.render(content);
        if (env != null) {
            // TODO: looks ugly
            env['fm'] = fm;
        }
        return body;
    };
}
