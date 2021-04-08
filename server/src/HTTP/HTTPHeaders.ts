// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers

export interface KeepAliveParams {
    timeout: number
    max: number
}

export interface HTTPHeaders {
    searchParams: URLSearchParams
    Connection: "keep-alive" | "close"
    "Keep-Alive": KeepAliveParams
}
