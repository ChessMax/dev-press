import e from "express";
import {buildCommand} from "./build_command";
import {watch} from "chokidar";

export async function serveCommand(): Promise<void> {
    await buildCommand({
        baseUrlOverride: '',
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
