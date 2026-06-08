/// <reference lib="dom" />

declare global {
    interface Response {
        json(): Promise<any>;
        readonly ok: boolean;
        readonly status: number;
    }
}

export { };
