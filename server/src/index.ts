import net from "net";
import { HTTPServer } from "./HTTP/HTTP";
import { HTTPSocket } from "./HTTP/HTTPSocket";

const server = net.createServer();
const http = new HTTPServer(server);
http.get("/", (data: Buffer, socket: HTTPSocket, headers: Record<string, string>) => {
    socket.write(
        Buffer.from("<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body><b>OK</b></body></html>"),
        { "Content-Type": "text/html" },
        200
    );
});

server.listen(5000, "127.0.0.1");
