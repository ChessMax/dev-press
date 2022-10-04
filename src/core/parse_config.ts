import * as yaml from "js-yaml";
import {deepmerge} from "deepmerge-ts";

export async function parseConfig<T>(content: string, defaultConfig?: Partial<T>): Promise<T> {
    let parsedConfig = await yaml.load(content) as object;
    if (defaultConfig) {
        let mergedConfig = deepmerge(defaultConfig, parsedConfig);
        let castedConfig = mergedConfig as unknown as T;
        return castedConfig;
    }
    return parsedConfig as unknown as T;
}
