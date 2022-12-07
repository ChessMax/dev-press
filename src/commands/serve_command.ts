import e from "express";
import {watch} from "chokidar";
import {WebSocket} from "ws";
import {AppFileSystem} from "../fs/app_file_system";
import {Config} from "../core/app_config";
import {DevPress} from "../core/dev_press";

export async function serveCommand(): Promise<void> {
    let fs = new AppFileSystem();
    let config = await Config.loadAppConfig(fs);
    let serverConfig = config.server;
    let port = serverConfig.port;

    let baseUrl = `http://localhost:${port}`;

    async function initialize():Promise<DevPress> {
        let app = await DevPress.initialize({
            config: {
                site: {
                    url: baseUrl,
                },
            }
        });
        app.beforeRenderers.push((post) => {
            post.bodyEnd.push(
                '<script>\n' +
                '    (function() {\n' +
                `        let ws = new WebSocket(\'ws://localhost:${port}\');\n` +
                '        ws.onmessage = function (msg) {\n' +
                '            if (msg.data === \'reload\') {\n' +
                '                console.log(\'reloading\');\n' +
                '                window.location.reload();\n' +
                '            }\n' +
                '        };\n' +
                '    })();\n' +
                '</script>'
            );
        });
        return app;
    }


    let app = await initialize();
    await app.build();

    let clients = new Array<WebSocket>();

    let reloadClients = () => {
        for (const client of clients) {
            client.send('reload');
        }
    };

    let ws = new WebSocket.Server({port: serverConfig.webSocketPort});
    ws.on('connection', (client) => {
        console.log('Client connected');
        client.onclose = () => {
            console.log('Client disconnected');
            clients = clients.filter((e) => e != client);
        }
        clients.push(client);
    });

    let building = false;

    let watcher = watch('.', {
        persistent: true,
        ignoreInitial: true,
        ignored: ['.*', './public', './node_modules'],
    }).on('all', async (event, path) => {
        if (!building) {
            building = true;
            console.log(`Something changed: ${event} ${path}`);

            let app = await initialize();
            await app.build();

            console.log('rebuild completed');

            reloadClients();

            building = false;
        }
    });

    const expressApp = e();

    expressApp.use(e.static(config.output));

    expressApp.listen(port, () => {
        console.log(`Serving started at ${baseUrl}`);
    });
}
