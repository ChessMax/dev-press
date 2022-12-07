import {DirectoryPath, FileExt, FileName, FilePath, FileSystem} from "../fs/file_system";

export class DeployFileSystem implements FileSystem {
    fs: FileSystem;
    filesWritten: string[] = [];

    constructor(fs: FileSystem) {
        this.fs = fs;
    }

    copyFile(srcPath: FilePath, outputPath: FilePath): Promise<void> {
        this.filesWritten.push(outputPath);
        return this.fs.copyFile(srcPath, outputPath);
    }

    extname(name: FileName): FileExt {
        return this.fs.extname(name);
    }

    getBaseName(path: FilePath, ext?: FileExt): FileName {
        return this.fs.getBaseName(path, ext);
    }

    getCurrentWorkingDir(subDir?: DirectoryPath): DirectoryPath {
        return this.fs.getCurrentWorkingDir(subDir);
    }

    getGlob(pattern: string, options?: { cwd?: string }): Promise<FilePath[]> {
        return this.fs.getGlob(pattern, options);
    }

    getPackageDir(): DirectoryPath {
        return this.fs.getPackageDir();
    }

    isAbsolute(path: FilePath): boolean {
        return this.fs.isAbsolute(path);
    }

    join(...paths: string[]): FilePath {
        return this.fs.join(...paths);
    }

    loadConfig<T>(path: FilePath, defaultConfig?: Partial<T>): Promise<T> {
        return this.fs.loadConfig<T>(path, defaultConfig);
    }

    makeDirRecursive(dir: DirectoryPath): Promise<void> {
        return this.fs.makeDirRecursive(dir);
    }

    readTextFile(path: FilePath): Promise<string | null> {
        return this.fs.readTextFile(path);
    }

    removeDirRecursive(dir: DirectoryPath): Promise<void> {
        return this.fs.removeDirRecursive(dir);
    }

    writeTextFile(path: FilePath, content: string): Promise<void> {
        this.filesWritten.push(path);
        return this.fs.writeTextFile(path, content);
    }
}
