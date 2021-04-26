import net from "net";
import { EventEmitter } from "events";

export type DataListenerCallback = (buf: Buffer) => void;

const HTTP_REASON_PHRASE: Record<number, string> = {
    101: "Switching Protocol",
    200: "OK",
    400: "Bad Request",
    403: "Forbidden",
    404: "Not Found",
    418: "I'm a teapot",
    500: "Internal Server Error",
    501: "Not Implemented"
};

/**
 * Convert an HTTP status code to a reason phrase
 * @param status The status code to lookup
 */
export function getReasonString(status: number): string {
    return status.toString() + " " + HTTP_REASON_PHRASE[status];
}

export declare interface HTTPSocket {
    on(event: "data", listener: (socket: HTTPSocket, data: Buffer) => void): this;
    on(event: "close", listener: (hadError: boolean) => void): this;
}

/**
 * An HTTP socket wrapper class
 */
export class HTTPSocket extends EventEmitter {
    /** The associated TCP socket */
    readonly socket: net.Socket;

    constructor(socket: net.Socket) {
        super();
        this.socket = socket;

        // emit a data event when the tcp socket returns data
        this.socket.on("data", (data: Buffer) => {
            this.emit("data", this, data);
        });

        // remove listeners from a tcp socket when it closes
        // emit a close event so that the server knows the socket is closed
        this.socket.on("close", (hadError: boolean) => {
            this.socket.removeAllListeners();
            this.emit("close", this, hadError);
        });
    }

    /**
     * Writes a response to the HTTP socket
     * @param data The data to give to the client. If this is a string, it will be converted to a buffer.
     * Set this parameter to be a number representing the length of the data to respond to a HEAD request
     * @param headers The response headers to give to the client
     * @param status The status code of the response
     */
    write(data: Buffer | number | string, headers: Record<string, string>, status: number): void {
        // convert data to buffer
        if (typeof data === "string") {
            data = Buffer.from(data);
        }

        let responseStr = "HTTP/1.1 " + getReasonString(status) + "\r\n";

        // add each header value
        for (const [key, value] of Object.entries(headers)) {
            responseStr += key + ": " + value + "\r\n";
        }
        responseStr += "Date: " + new Date().toUTCString() + "\r\n";
        responseStr += "Connection: Keep-Alive\r\n";
        // change content length parameter based on data parameter type
        if (typeof data === "number") {
            responseStr += "Content-Length: " + data.toString() + "\r\n";
        } else {
            responseStr += "Content-Length: " + data.length.toString() + "\r\n";
        }
        responseStr += "\r\n";

        let responseBuf: Buffer;
        // if head request, the response buffer is just the headers
        if (typeof data === "number") {
            responseBuf = Buffer.from(responseStr, "utf-8");
        }
        // otherwise, concatenate the headers and data
        else {
            responseBuf = Buffer.alloc(responseStr.length + data.length);
            responseBuf.set(Buffer.from(responseStr, "utf-8"));
            responseBuf.set(data, responseStr.length);
        }

        // write to client
        this.socket.write(responseBuf);
    }
}
