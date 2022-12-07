import {DevPress} from "../core/dev_press";
import {DeployFileSystem} from "../deploy/deploy_file_system";
import {AppFileSystem} from "../fs/app_file_system";
import path from "path";

export async function deployCommand(params: { dry?: boolean }): Promise<void> {
    let fs = new DeployFileSystem(new AppFileSystem());

    let app = await DevPress.initialize({fs: fs});

    let output = app.config.output;

    let deployPath = fs.join(output, '.deploy');
    let previousFilesContent = await fs.readTextFile(deployPath);
    let previousFiles = previousFilesContent?.split('\n');

    // if (previousFiles == null) {
    //     console.log('Previous deploy info not found.')
    //     return;
    // }

    await app.build();

    let content = fs.filesWritten.map(
        (outputPath) => path.relative(output, outputPath)
    ).join('\n');

    console.log(`Written files [${fs.filesWritten.length}]:`);
    console.log(content);

    await fs.writeTextFile(deployPath, content);
}

