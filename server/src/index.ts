import net from "net";
import { HTTPServer, HTTPMethods } from "./HTTP/HTTP";
import { HTTPSocket } from "./HTTP/HTTPSocket";

const server = net.createServer();
const http = new HTTPServer(server);
http.get("/", (method: HTTPMethods, socket: HTTPSocket, headers: Record<string, string>) => {
    socket.write(
        Buffer.from("<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body><b>OK</b></body></html>"),
        { "Content-Type": "text/html" },
        200
    );
});

http.static("src");

server.listen(5000, "127.0.0.1");
