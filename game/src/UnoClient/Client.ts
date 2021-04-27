import { Uno, GameAPI } from "uno-server-game";

const API_ENDPOINT = location.host + "/game/";

export class UnoClient {
    private name: string;
    private id: number;
    private hand: Uno.Card.Card[];
    private players: GameAPI.PlayerInfo[];
    private gameState: GameAPI.GameState;

    private readonly defaultGameState: GameAPI.GameState = {
        lastModified: 0,
        currentPlayer: -1,
        gameRunning: false,
        discard: { color: -1, number: -1 },
        winner: null,
        players: [],
        playerOrder: 1
    };

    constructor(name: string) {
        this.name = "";
        this.id = -1;
        this.hand = [];
        this.gameState = this.defaultGameState;
        this.players = [];

        this.register(name);
    }

    reset(): void {
        this.name = "";
        this.id = -1;
        this.hand = [];
        this.gameState = this.defaultGameState;
        this.players = [];
    }

    startGame(): void {
        fetch(API_ENDPOINT + "/start", { method: "POST "});
    }

    resetGame(): void {
        fetch(API_ENDPOINT + "/reset", { method: "POST" });
    }

    async register(name: string): Promise<void> {
        const req = await fetch(API_ENDPOINT + "/register", {
            method: "POST",
            body: JSON.stringify({ name })
        });
        if (req.status !== 200) return;
        const res = await req.json();
        if (!GameAPI.isRegisterResponse(res)) return;

        this.id = res.id;
        this.hand = res.hand;
    }

    async update(): Promise<void> {
        const req = await fetch(API_ENDPOINT + "/state");
        if (req.status !== 200) return;
        const res = await req.json();
        if (!GameAPI.isGameState(res)) return;

        if (res.lastModified > this.gameState.lastModified) {
            this.gameState = res;
            await this.updatePlayerInfo();
            await this.updateHand();

            this.updateUI();
        }
    }

    async updateHand(): Promise<void> {
        const req = await fetch(API_ENDPOINT + "/players?id=" + this.id.toString());
        if (req.status !== 200) return;
        const res = await req.json();
        if (!Uno.Player.isPlayer(res)) return;

        this.hand = res.hand;
    }

    async updatePlayerInfo() {
        const req = await fetch(API_ENDPOINT + "/players");
        if (req.status !== 200) return;
        const res = await req.json();
        if (!(Array.isArray(res) && res.every((i: any) => GameAPI.isPlayerInfo(i)))) return;

        this.players = res;
    }

    async discard(c: number, wild?: Uno.CardColors.CardColors): Promise<GameAPI.DiscardResposeReason> {
        const card: GameAPI.DiscardBody = {
            id: this.id,
            card: c,
            wild
        };

        const req = await fetch(API_ENDPOINT + "/discard", {
            method: "POST",
            body: JSON.stringify(card)
        });
        if (req.status !== 200) return GameAPI.DiscardResposeReason.INVALID_DISCARD;
        const res = await req.json();
        if (!GameAPI.isDiscardResponse(res)) return GameAPI.DiscardResposeReason.INVALID_DISCARD;

        return res.reason;
    }

    updateUI(): void {
        //
    }
}
