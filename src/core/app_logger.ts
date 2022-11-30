import * as util from "util";

export abstract class AppLogger {
    static log(message?: any) :void{
        console.log(message);
    }
    static logInspect(name: string, obj: any): void {
        let str = util.inspect(obj, {showHidden: false, depth: null, colors: true});
        AppLogger.log(`${name}: ${str}`);
    }
}
