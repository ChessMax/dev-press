import e from "express";
import {buildCommand} from "./build_command";
import {watch} from "chokidar";
import {WebSocket} from "ws";
import {AppFileSystem} from "../fs/app_file_system";
import {Config} from "../core/app_config";

export async function serveCommand(): Promise<void> {
    let fs = new AppFileSystem();
    let config = await Config.loadAppConfig(fs);
    let serverConfig = config.server;
    let port = serverConfig.port;

    let baseUrl = `http://localhost:${port}`;
    await buildCommand({
        baseUrlOverride: baseUrl,
    });

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

            await buildCommand({
                baseUrlOverride: '',
            });

            console.log('rebuild completed');

            reloadClients();

            building = false;
        }
    });

    const app = e();

    app.use(e.static(config.output));

    app.listen(port, () => {
        console.log(`Serving started at ${baseUrl}`);
    });
}
