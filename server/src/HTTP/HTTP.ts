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
        if (this.staticPath === "") {
            socket.write(0, {}, 404);
        }

        const filePath = (path.join(this.staticPath, requestedPath));
        console.log(filePath);
        let data: Buffer | number;
        if (method === "HEAD") {
            let fileStats = fs.statSync(filePath);
            data = fileStats.size;
        } else {
            data = fs.readFileSync(filePath);
        }
        socket.write(data, {}, 200);
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
