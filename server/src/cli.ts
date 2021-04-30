import net from "net";
import { HTTPServer, MIME_TYPES } from "./HTTP/HTTP";
import { getReasonString } from "./HTTP/HTTPSocket";
import { UnoGame } from "./Uno/Game";
import * as APITypes from "./GameAPI/APITypes";

const game = new UnoGame();

const server = net.createServer();
const http = new HTTPServer(server);

http.get("/game", (socket) => {
    socket.write(JSON.stringify({version: 1}), {"Content-Type": MIME_TYPES[".json"]}, 200);
});

// Register a player to the game
// Gives the player an ID number that they can use once the game is started
http.post("/game/register", (socket, _headers, body) => {
    let bodyJSON: APITypes.RegisterBody;
    try {
        // try to parse JSON, will throw error if fails to parse
        bodyJSON = JSON.parse(body.toString("utf-8"));
        // once parsed, check if body is formatted to the correct type
        // if not, send 400 Bad Request
        if (!APITypes.isRegisterBody(bodyJSON)) {
            socket.write(getReasonString(400), {}, 400);
            return;
        }
    } catch {
        // if JSON failed to parse, send 400 Bad Request
        socket.write(getReasonString(400), {}, 400);
        return;
    }

    const id = game.addPlayer(bodyJSON.name);
    const player: APITypes.RegisterResponse = { id, name: bodyJSON.name, hand: []};
    socket.write(JSON.stringify(player), { "Content-Type": MIME_TYPES[".json"] }, 200);
});

// Forces the game to start
http.post("/game/start", (socket) => {
    game.startGame();
    const res: APITypes.GenericResponse = { success: true }
    socket.write(JSON.stringify(res), { "Content-Type": MIME_TYPES[".json"] }, 200);
});

// Forces the game to reset
http.post("/game/reset", (socket) => {
    game.resetGame();
    const res: APITypes.GenericResponse = { success: true };
    socket.write(JSON.stringify(res), {}, 200);
});

// Gets players in the game
// If an id is given in the querystring, a specific player object is returned
//   contains player name, and complete hand
// If no id is given, it returns an overview of the players
//   Array of PlayerInfo each with length of hand and name
http.get("/game/players", (socket, headers) => {
    const params = new URLSearchParams(headers.searchParams);
    if (params.has("id")) {
        let player = game.getPlayer(Number(params.get("id")));
        if (player === undefined) {
            player = { name: "", hand: [] };
        }
        socket.write(JSON.stringify(player), { "Content-Type": MIME_TYPES[".json"] }, 200);
    } else {
        const players = game.getPlayerInfo();
        socket.write(JSON.stringify(players), { "Content-Type": MIME_TYPES[".json"] }, 200);
    }
});

// Discards a card from a player
// Player's ID must be included in POST body
// A response will include the success status and a reason for failure (if applicable)
http.post("/game/discard", (socket, _headers, body) => {
    let bodyJSON: APITypes.DiscardBody;
    try {
        bodyJSON = JSON.parse(body.toString("utf-8"));
        if (!APITypes.isDiscardBody(bodyJSON)) {
            socket.write(getReasonString(400), {}, 400);
            return;
        }
    } catch {
        socket.write(getReasonString(400), {}, 400);
        return;
    }

    let res: APITypes.DiscardResponse;

    // if player ID can't be found, send PLAYER_NOT_FOUND error
    if (!game.getPlayer(bodyJSON.id)) {
        res = {
            success: false,
            reason: APITypes.DiscardResposeReason.PLAYER_NOT_FOUND
        };
        socket.write(
            JSON.stringify(res),
            { "Content-Type": MIME_TYPES[".json"] },
            200
        );
        return;
    }

    // discard the card
    // if discard fails, send INVALID_DISCARD error
    if (!game.discard(bodyJSON.id, bodyJSON.card, bodyJSON.wild)) {
        res = {
            success: false,
            reason: APITypes.DiscardResposeReason.INVALID_DISCARD
        };
        socket.write(
            JSON.stringify(res),
            { "Content-Type": MIME_TYPES[".json"] },
            200
        );
    }

    // if discard succeeded, send OK response
    res = {
        success: true,
        reason: APITypes.DiscardResposeReason.OK
    };
    socket.write(
        JSON.stringify(res),
        { "Content-Type": MIME_TYPES[".json"] },
        200
    );
});

// Request the game's status
http.get("/game/status", (socket) => {
    const status = game.getGameState();
    socket.write(JSON.stringify(status), { "Content-Type": MIME_TYPES[".json"] }, 200);
});

if (process.argv.length < 4) {
    console.log("Process needs two arguments: Static folder and port");
    console.log("Example:");
    console.log("    " + process.argv[0] + " " + "./dist 5000");
    process.exit();
}

http.static(process.argv[2]);

server.listen(Number(process.argv[3]), "0.0.0.0");
