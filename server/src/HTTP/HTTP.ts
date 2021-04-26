import net from "net";
import { HTTPSocket, getReasonString } from "./HTTPSocket";
import path from "path";
import fs from "fs";

const HTTP_METHODS_REGEX = /^(?:GET|POST|HEAD)/i;
export type HTTPMethods = "GET" | "POST" | "HEAD";

export type GetResponseCallback = (socket: HTTPSocket, headers: Record<string, string>) => void;
export type PostResponseCallback = (socket: HTTPSocket, headers: Record<string, string>, body: Buffer) => void;

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


/**
 * An HTTP server class
 */
export class HTTPServer {
    /** The TCP server */
    private server: net.Server;
    /** The path to serve files from */
    private staticPath: string;
    /** The list of registered methods */
    private registeredMethods: RegisteredMethodObj[] = [];
    /** The list of connected sockets */
    private sockets: HTTPSocket[] = [];

    constructor(server: net.Server) {
        this.staticPath = "";

        this.server = server;

        // when new connections come in
        this.server.on("connection", (socket: net.Socket) => {
            // wrap socket in http socket class
            const httpSocket = new HTTPSocket(socket);
            this.sockets.push(httpSocket);

            // add on data listener
            httpSocket.on("data", this.onData.bind(this));

            // remove socket when it closes
            httpSocket.on("close", () => {
                this.sockets.splice(this.sockets.indexOf(httpSocket), 1);

                httpSocket.removeAllListeners();
            });
        });
    }

    /**
     * Parses the data from the socket
     * Gives the data to the handler, or serves a file if no handler was found
     * @param socket The socket receiving the data
     * @param data The buffer of data from the client
     */
    private onData(socket: HTTPSocket, data: Buffer): void {
        // convert data to string to parse at beginning
        const dataString = data.toString("utf-8").trim();

        // if request is a HEAD, GET, or POST
        if (HTTP_METHODS_REGEX.test(dataString)) {
            const rows = dataString.split("\r\n");

            // get method, path, and HTTP version from first row
            // version is unused, currently
            const [method, path] = rows[0].split(" ");
            // split the querystring from the path
            const [realPath, queryString] = path.split("?");

            // find the handler if it exists
            // Must have the same method and path as the current request
            // OR handler method must be GET and method must be HEAD
            const handler = this.registeredMethods.find(item => {
                return (item.method === method || (item.method === "GET" && method === "HEAD")) && item.path === realPath;
            });

            // object for storing headers
            const headers: Record<string, string> = {};
            headers.searchParams = queryString;
            headers.method = method;
            headers.path = path;
            // loop through the headers
            for (let i = 1; i < rows.length; i++) {
                // if line is blank, there are no more headers
                // headers end after \r\n\r\n
                if (rows[i] === "") break;

                // add to headers object, matching the pattern:
                // Key: Value
                const match = rows[i].match(/(.+): (.+)/);
                if (match?.length === 3) {
                    headers[match[1]] = match[2];
                }
            }

            let postData = Buffer.alloc(0);
            // if post request and a body was provided
            if (method === "POST" && Object.prototype.hasOwnProperty.call(headers, "Content-Length")) {
                // find the end of headers / start of body
                const startOfData = data.indexOf(Buffer.from("\r\n\r\n")) + 4;
                // set post data to be start of body and end after Content-Length bytes
                postData = data.slice(startOfData, startOfData + Number(headers["Content-Length"]));
            }

            // if the handler exists
            if (handler !== undefined) {
                // give different arguments depending on the method
                if (handler.method === "GET") {
                    (handler.callback as GetResponseCallback)(socket, headers);
                } else if (handler.method === "POST") {
                    (handler.callback as PostResponseCallback)(socket, headers, postData);
                } else {
                    socket.write(getReasonString(403), {}, 403);
                }
            } else {
                // if no handler and GET or HEAD request, serve file
                if (method === "GET" || method === "HEAD") {
                    this.serveStaticPage(method, path, socket);
                } else {
                    socket.write(getReasonString(403), {}, 403);
                }
            }
        } else {
            // request type is not supported
            // return 501 Not Implemented
            socket.write(getReasonString(501), {}, 501);
        }
    }

    /**
     * Serves a static webpage from a file
     * @param method The method of the request
     * @param requestedPath The path of the request
     * @param socket The client that made the request
     * @param headers The headers of the request
     */
    private serveStaticPage(method: HTTPMethods, requestedPath: string, socket: HTTPSocket): void {
        // default / to index.html
        if (requestedPath === "/") {
            requestedPath = "/index.html";
        }
        const filePath = (path.join(this.staticPath, requestedPath));

        // if static path is not set, or if file doesn't exist yet
        // send 404 response
        if (this.staticPath === "" || !fs.existsSync(filePath)) {
            socket.write(getReasonString(404), {}, 404);
            return;
        }

        let data: Buffer | number;
        // if method is head, only send headers, no data
        if (method === "HEAD") {
            const fileStats = fs.statSync(filePath);
            data = fileStats.size;
        } else {
            // read file to send
            data = fs.readFileSync(filePath);
        }

        // find the mimetype of the file from the extension
        let mimeType: string;
        for (const [extension, type] of Object.entries(MIME_TYPES)) {
            if (filePath.endsWith(extension)) {
                mimeType = type;
                break;
            }
        }
        // if no mime type was found from the extension, set default mimetype
        mimeType ??= MIME_TYPES["*"];

        // write a 200 response with mimetype and data
        // data will just be the file length if it is a head request
        socket.write(
            data,
            { "Content-Type": mimeType },
            200
        );
    }

    /**
     * Set the path to be served by the server
     * @param pathToServe The path on the filesystem to serve
     */
    static(pathToServe: string): void {
        this.staticPath = path.resolve(pathToServe);
    }

    /**
     * Register a GET request handler
     * @param path The path that will be requested
     * @param callback The callback that will run when the path is requested
     */
    get(path: string, callback: GetResponseCallback): void {
        this.registeredMethods.push({
            method: "GET",
            path,
            callback
        });
    }

    /**
     * Register a POST request handler
     * @param path The path that will be requested
     * @param callback The callback that will run when the path is requested
     */
    post(path: string, callback: PostResponseCallback): void {
        this.registeredMethods.push({
            method: "POST",
            path,
            callback
        });
    }

    listen(port: number, ip: string): void {
        this.server.listen(port, ip);
    }
}
