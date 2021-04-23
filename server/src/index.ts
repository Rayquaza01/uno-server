import net from "net";
import { HTTPServer, HTTPMethods, MIME_TYPES } from "./HTTP/HTTP";
import { HTTPSocket } from "./HTTP/HTTPSocket";

const server = net.createServer();
const http = new HTTPServer(server);
http.get("/api", (socket: HTTPSocket, headers: Record<string, string>) => {
    socket.write(
        Buffer.from("<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body><b>OK</b></body></html>"),
        { "Content-Type": MIME_TYPES[".html"] },
        200
    );
});

http.post("/api", (socket: HTTPSocket, headers: Record<string, string>, data: Buffer) => {
    console.log(data.toString("utf-8"));
    socket.write(
        Buffer.from(JSON.stringify({
            success: true
        })),
        { "Content-Type": MIME_TYPES[".json"] },
        200
    );
});

http.static("src");

server.listen(5000, "127.0.0.1");
