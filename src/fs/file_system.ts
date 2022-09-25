export type FileExt = string;
export type FileName = string;
export type FilePath = string;
export type DirectoryPath = string;

export interface FileSystem {
    loadConfig<T>(path: FilePath, defaultConfig?: T): Promise<T>;

    isAbsolute(path: FilePath): boolean;

    getCurrentWorkingDir(): DirectoryPath;

    join(...paths: string[]): FilePath;

    getBaseName(path: FilePath, ext?: FileExt): FileName;

    getGlob(pattern: string): Promise<FilePath[]>;

    getPackageDir(): DirectoryPath;

    readTextFile(path: FilePath): Promise<string>;

    makeDirRecursive(dir: DirectoryPath): Promise<void>;

    removeDirRecursive(dir: DirectoryPath): Promise<void>;

    copyFile(srcPath: FilePath, outputPath: FilePath): Promise<void>;

    writeTextFile(path: FilePath, content: string): Promise<void>;

    extname(name: FileName): FileExt;
}
