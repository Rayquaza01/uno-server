import net from "net";

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

export class HTTPSocket {
    readonly socket: net.Socket;

    constructor(socket: net.Socket) {
        this.socket = socket;
    }

    write(data: Buffer, headers: Record<string, string>, status: number): void {
        let responseStr = "HTTP/1.1 " + status.toString() + " " + HTTP_REASON_PHRASE[status] + "\r\n";

        for (let [key, value] of Object.entries(headers)) {
            responseStr += key + ": " + value + "\r\n";
        }
        responseStr += "Date: " + new Date().toUTCString() + "\r\n";
        responseStr += "Connection: Keep-Alive\r\n";
        responseStr += "Content-Length: " + (data.length) + "\r\n";
        responseStr += "\r\n";

        let responseBuf = Buffer.alloc(responseStr.length + data.length);
        responseBuf.set(Buffer.from(responseStr, "utf-8"));
        responseBuf.set(data, responseStr.length);

        console.log(responseStr);

        this.socket.write(responseBuf);
    }
}
