import net from "net";
import { HTTPSocket } from "./HTTPSocket";
import path from "path";
import fs from "fs";

const HTTP_METHODS_REGEX = /^(?:GET|POST|HEAD)/i
export type HTTPMethods = "GET" | "POST" | "HEAD";

export type GetResponseCallback = (method: HTTPMethods, socket: HTTPSocket, headers: Record<string, string>) => void;
export type PostResponseCallback = (method: HTTPMethods, socket: HTTPSocket, headers: Record<string, string>, data: Buffer) => void;

export interface RegisteredMethodObj {
    method: HTTPMethods;
    path: string;
    callback: GetResponseCallback | PostResponseCallback;
}

export const MIME_TYPES = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".woff": "application/font-woff",
    ".ttf": "application/font-ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".otf": "application/font-otf",
    ".wasm": "application/wasm",
    "*": "application/octet-stream"
};


export class HTTPServer {
    private server: net.Server;
    private staticPath: string;
    private registeredMethods: RegisteredMethodObj[] = [];
    private sockets: HTTPSocket[] = [];

    constructor(server: net.Server) {
        this.staticPath = "";

        this.server = server;
        this.server.on("connection", (socket: net.Socket) => {
            let httpSocket = new HTTPSocket(socket);
            this.sockets.push(httpSocket);
            httpSocket.on("data", this.onData.bind(this));
            httpSocket.on("close", () => {
                this.sockets.splice(this.sockets.indexOf(httpSocket), 1);

                httpSocket.removeAllListeners();
            });
        });
    }

    private onData(socket: HTTPSocket, data: Buffer): void {
        let dataString = data.toString("utf-8").trim();
        if (HTTP_METHODS_REGEX.test(dataString)) {
            let rows = dataString.split("\r\n");

            let [method, path, version] = rows[0].split(" ");
            let [realPath, queryString] = path.split("?");
            let handler = this.registeredMethods.find(item => {
                return item.method === method && item.path === realPath;
            });

            let headers: Record<string, string> = {};
            headers.searchParams = queryString;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i] === "") break;

                let match = rows[i].match(/(.+): (.+)/);
                if (match?.length === 3) {
                    headers[match[1]] = match[2];
                }
            }

            let postData = Buffer.alloc(0);
            if (method === "POST" && Object.prototype.hasOwnProperty.call(headers, "Content-Length")) {
                const startOfData = data.indexOf(Buffer.from("\r\n\r\n")) + 4;
                postData = data.slice(startOfData, startOfData + Number(headers["Content-Length"]));
            }

            if (handler !== undefined) {
                if (handler.method === "GET" && method === "GET" || method === "HEAD") {
                    (handler.callback as GetResponseCallback)(method, socket, headers);
                } else if (handler.method === "POST" && method === "POST") {
                    (handler.callback as PostResponseCallback)(method, socket, headers, postData);
                } else {
                    socket.write(0, {}, 403);
                }
            } else {
                if (method === "GET" || method === "HEAD") {
                    this.serveStaticPage(method, path, socket, headers);
                } else {
                    socket.write(0, {}, 403);
                }
            }
        }
    };

    private serveStaticPage(method: HTTPMethods, requestedPath: string, socket: HTTPSocket, headers: Record<string, unknown>): void {
        if (requestedPath === "/") {
            requestedPath = "/index.html";
        }
        const filePath = (path.join(this.staticPath, requestedPath));

        if (this.staticPath === "" || !fs.existsSync(filePath)) {
            socket.write(0, {}, 404);
            return;
        }

        console.log(filePath);
        let data: Buffer | number;
        if (method === "HEAD") {
            const fileStats = fs.statSync(filePath);
            data = fileStats.size;
        } else {
            data = fs.readFileSync(filePath);
        }

        let mimeType: string;
        for (let [extension, type] of Object.entries(MIME_TYPES)) {
            if (filePath.endsWith(extension)) {
                mimeType = type;
                break;
            }
        }
        mimeType ??= MIME_TYPES["*"];

        socket.write(
            data,
            { "Content-Type": mimeType },
            200
        );
    }

    static(pathToServe: string) {
        this.staticPath = path.resolve(pathToServe);
    }

    get(path: string, callback: GetResponseCallback) {
        this.registeredMethods.push({
            method: "GET",
            path,
            callback
        });
    }

    post(path: string, callback: PostResponseCallback) {
        this.registeredMethods.push({
            method: "POST",
            path,
            callback
        });
    }
}
