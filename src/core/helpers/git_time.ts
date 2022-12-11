import {FilePath} from '../../fs/file_system';
import spawn from 'cross-spawn';

export function getGitLastUpdatedTime(filePath: FilePath): Date | null {
    let output = spawn
        .sync(
            'git',
            ['log', '--max-count=1', '--format=%at', '--', filePath]
        )
        .stdout.toString('utf-8');
    let timestamp = parseInt(output) * 1000;
    return timestamp ? new Date(timestamp) : null;
}

export function getGitCreatedTime(filePath: FilePath): Date | null {
    let outputs = spawn
        .sync(
            'git',
            ['log', '--follow', '--format=%at', '--', filePath]
        )
        .stdout.toString('utf-8').split('\n');

    for (let i = outputs.length - 1; i >= 0; --i) {
        let output = outputs[i];
        if (output.trim().length > 0) {
            let timestamp = parseInt(output) * 1000;
            return timestamp ? new Date(timestamp) : null;
        }
    }

    return null;
}
