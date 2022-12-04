export abstract class StringHelpers {
    static snakeCaseToCamelCase(input: string): string {
        return input
            .split("_")
            .reduce(
                (res, word, i) =>
                    i === 0
                        ? word.toLowerCase()
                        : `${res}${word.charAt(0).toUpperCase()}${word
                            .substring(1)
                            .toLowerCase()}`,
                ""
            );
    }
}
