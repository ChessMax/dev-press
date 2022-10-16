import e from "express";
import {buildCommand} from "./build_command";
import {watch} from "chokidar";
import {WebSocket} from "ws";

export async function serveCommand(): Promise<void> {
    await buildCommand({
        baseUrlOverride: '',
    });

    let clients = new Array<WebSocket>();

    let reloadClients = () => {
        for (const client of clients) {
            client.send('reload');
        }
    };

    let ws = new WebSocket.Server({port: 9000});
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
    const port = 3000;

    app.use(e.static('./public/'));

    app.listen(port, () => {
        console.log(`Serving started at http://localhost:${port}`);
    });
}
