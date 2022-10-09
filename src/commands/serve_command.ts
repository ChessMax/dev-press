import e from "express";
import {buildCommand} from "./build_command";

export async function serveCommand(): Promise<void> {
    await buildCommand({
        baseUrlOverride: '',
    });

    const app = e();
    const port = 3000;

    app.use(e.static('./public/'));

    app.listen(port, () => {
        console.log(`Serving started at http://localhost:${port}`);
    });
}
