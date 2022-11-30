import {DevPress} from "../core/dev_press";

export async function buildCommand(): Promise<void> {
    let app = await DevPress.initialize();
    await app.build();
}

