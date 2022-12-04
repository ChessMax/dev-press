import {PluginConfig} from "./plugin_config";
import {DirectoryPath} from "../fs/file_system";
import {DevPress, StaticFilesRenderer} from "../core/dev_press";

export function initialize(context: DevPress) {
    let staticFilesRenderer: StaticFilesRenderer = async (outputDir) => {

        // TODO: provide plugin name somehow?
        let fs = context.fs;
        let config = context.config;
        let pluginConfig = context.getConfigByName('staticFiles') as StaticFilesPluginConfig;
        let patterns = pluginConfig?.patterns;
        if (patterns == null) return;

        let themeDir = config.theme;
        let sourceDir = config.source;

        // TODO: could it be done better?
        let getFiles = async (dir: DirectoryPath, patterns: string[]):Promise<void> => {
            let files: Set<string> = new Set<string>();

            for (let pattern of patterns) {
                let filesByPattern = await fs.getGlob(pattern, {cwd: dir});
                filesByPattern.forEach(files.add, files);
            }

            for (let file of files) {
                await fs.copyFile(
                    fs.join(dir, file),
                    fs.join(outputDir, file)
                );
            }
        }

        await getFiles(sourceDir, patterns);
        await getFiles(themeDir, patterns);
    };

    context.staticFileRenderers.push(staticFilesRenderer);
}

interface StaticFilesPluginConfig extends PluginConfig {
    patterns?: string[];
}
