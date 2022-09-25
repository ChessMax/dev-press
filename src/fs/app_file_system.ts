import {glob} from "glob";
import * as _path from 'path'
import * as fse from "fs-extra";
import {DirectoryPath, FileExt, FileName, FilePath, FileSystem} from "./file_system";
import * as yaml from "js-yaml";
import {deepmerge} from "deepmerge-ts";

export class AppFileSystem implements FileSystem {
    private encoding = 'utf8';

    async loadConfig<T>(path: FilePath, defaultConfig?: Partial<T>): Promise<T> {
        let content = await this.readTextFile(path);
        let parsedConfig = await yaml.load(content) as object;
        if (defaultConfig) {
            let mergedConfig = deepmerge(defaultConfig, parsedConfig);
            let castedConfig = mergedConfig as unknown as T;
            return castedConfig;
        }
        return parsedConfig as unknown as T;
    }

    isAbsolute(path: FilePath): boolean {
        return _path.isAbsolute(path);
    }

    getCurrentWorkingDir(): string {
        return process.cwd();
    }

    getPackageDir(): DirectoryPath {
        return __dirname;
    }

    getGlob(pattern: string): Promise<FilePath[]> {
        return Promise.resolve(glob.sync(pattern));
    }

    async readTextFile(path: FilePath): Promise<string> {
        return await fse.readFile(path, this.encoding);
    }

    removeDirRecursive(dir: DirectoryPath): Promise<void> {
        return fse.rm(dir, {recursive: true});
    }

    copyFile(srsPath: FilePath, outputPath: FilePath): Promise<void> {
        return fse.copy(srsPath, outputPath, {recursive: true, overwrite: true});
    }

    writeTextFile(path: FilePath, content: string): Promise<void> {
        return fse.outputFile(path, content, {encoding: this.encoding});
    }

    extname(name: FileName): FileExt {
        return _path.extname(name);
    }

    makeDirRecursive(dir: DirectoryPath): Promise<void> {
        return fse.mkdirs(dir);
    }

    getBaseName(path: FilePath, ext?: FileExt): FileName {
        return _path.basename(path, ext);
    }

    join(...paths: string[]): string {
        return _path.join(...paths);
    }
}

