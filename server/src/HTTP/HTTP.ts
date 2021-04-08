import net from "net";
import { HTTPHeaders } from "./HTTPHeaders";
import { HTTPSocket } from "./HTTPSocket";
import path from "path";

const HTTP_METHODS_REGEX = /^(?:GET|POST|HEAD)/i
export type HTTPMethods = "GET" | "POST" | "HEAD";

export type ResponseCallback = (data: Buffer, socket: HTTPSocket, headers: Record<string, string>) => void;

export interface RegisteredMethodObj {
    method: HTTPMethods;
    path: string;
    callback: ResponseCallback;
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
            socket.on("data", this.onData.bind(this, httpSocket));

            console.log(this.sockets.length);
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

            if (handler !== undefined) {
                handler.callback(data, socket, headers);
            } else {
                this.serveStaticPage(path, socket, headers);
            }
        }
    };

    private serveStaticPage(requestedPath: string, socket: HTTPSocket, headers: Record<string, unknown>): void {
        console.log(requestedPath);
        socket.write(Buffer.alloc(0), {}, 404);
    }

    static(pathToServe: string) {
        this.staticPath = path.resolve(pathToServe);
    }

    get(path: string, callback: ResponseCallback) {
        this.registeredMethods.push({
            method: "GET",
            path,
            callback
        });
    }

    post(path: string, callback: ResponseCallback) {

    }
}
