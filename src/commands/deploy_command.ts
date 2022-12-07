import {DevPress} from "../core/dev_press";
import {DeployFileSystem} from "../deploy/deploy_file_system";
import {AppFileSystem} from "../fs/app_file_system";

export async function deployCommand(params: {dry?:boolean}): Promise<void> {
    let fs = new DeployFileSystem(new AppFileSystem());
    let app = await DevPress.initialize({fs: fs});
    await app.build();


}

