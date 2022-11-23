import {AuthorMeta, SiteMeta} from "../post/post";
import {ViewEngineConfig} from "../view/view_engine_config";
import {ServerConfig} from "../commands/server_config";
import {FileSystem} from "../fs/file_system";

export interface AppConfig {
    site: SiteMeta;
    author: AuthorMeta;
    output: string;
    server: ServerConfig;
    viewEngine: ViewEngineConfig;
}

export async function loadAppConfig(fs: FileSystem, name: string = 'config.yaml') : Promise<AppConfig> {
    let config = await fs.loadConfig<AppConfig>(name, {
        viewEngine: {
            name: 'vash',
            views: './theme/',
        },
        server: {
            port: 3000,
            webSocketPort: 9000,
        }
    });
    return config;
}
