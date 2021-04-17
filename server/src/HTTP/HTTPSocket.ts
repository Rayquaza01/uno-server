import net from "net";
import { EventEmitter } from "events";

export type DataListenerCallback = (buf: Buffer) => void;

export const HTTP_REASON_PHRASE: Record<number, string> = {
    101: "Switching Protocol",
    200: "OK",
    400: "Bad Request",
    403: "Forbidden",
    404: "Not Found",
    418: "I'm a teapot",
    500: "Internal Server Error",
    501: "Not Implemented"
}

export declare interface HTTPSocket {
    on(event: "data", listener: (socket: HTTPSocket, data: Buffer) => void): this;
}

export class HTTPSocket extends EventEmitter {
    readonly socket: net.Socket;

    constructor(socket: net.Socket) {
        super();
        this.socket = socket;

        this.socket.on("data", (data: Buffer) => {
            this.emit("data", this, data);
        });
    }

    write(data: Buffer | number, headers: Record<string, string>, status: number): void {
        let responseStr = "HTTP/1.1 " + status.toString() + " " + HTTP_REASON_PHRASE[status] + "\r\n";

        for (let [key, value] of Object.entries(headers)) {
            responseStr += key + ": " + value + "\r\n";
        }
        responseStr += "Date: " + new Date().toUTCString() + "\r\n";
        responseStr += "Connection: Keep-Alive\r\n";
        if (typeof data === "number") {
            responseStr += "Content-Length: " + data.toString() + "\r\n";
        } else {
            responseStr += "Content-Length: " + data.length.toString() + "\r\n";
        }
        responseStr += "\r\n";

        let responseBuf: Buffer;
        if (typeof data === "number") {
            responseBuf = Buffer.alloc(responseStr.length);
            responseBuf.set(Buffer.from(responseStr, "utf-8"));
        } else {
            responseBuf = Buffer.alloc(responseStr.length + data.length);
            responseBuf.set(Buffer.from(responseStr, "utf-8"));
            responseBuf.set(data, responseStr.length);
        }

        this.socket.write(responseBuf);
    }
}
