export interface Template<T> {
    render: (model: T) => Promise<string>;
}
