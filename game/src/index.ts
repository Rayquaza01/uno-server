require("./index.css");
import { Uno } from "uno-server-game";
import { UnoClient } from "./UnoClient/Client";
import { PopupMode } from "./UnoClient/UpdateUIOptions";

const client = new UnoClient();

// registration related elements
const REGISTRATION = document.querySelector(".registration") as HTMLDivElement;
const REGISTER_BUTTON = document.querySelector("#registerSubmit") as HTMLButtonElement;
const NAME_INPUT = document.querySelector("#nameInput") as HTMLInputElement;
const START_BUTTON = document.querySelector("#start") as HTMLButtonElement;

// game button related elements
const GAME_BUTTONS = document.querySelector(".gameButtons") as HTMLDivElement;
const DRAW_CARD_BUTTON = document.querySelector("#draw") as HTMLButtonElement;
const RESET_BUTTON = document.querySelector("#reset") as HTMLButtonElement;

// player hand element
const HAND_CONTAINER = document.querySelector("#hand") as HTMLDivElement;

// wild selection related elements
const WILD_SELECT = document.querySelector("#wildSelect") as HTMLSelectElement;
const WILD_SUBMIT = document.querySelector("#wildSubmit") as HTMLButtonElement;
const WILD_CANCEL = document.querySelector("#wildCancel") as HTMLButtonElement;

/**
 * Update the client and ensure that the correct buttons are showing
 */
function update(): void {
    client.update();

    // if game is running
    if (client.getGameState().gameRunning && REGISTRATION.style.display !== "none") {
        // hide registration, show game buttons
        REGISTRATION.style.display = "none";
        GAME_BUTTONS.style.display = "inherit";

        // enable all registration options
        REGISTER_BUTTON.disabled = false;
        START_BUTTON.disabled = false;
        NAME_INPUT.disabled = false;
    }

    // if game is not running and winner has been cleared
    if (!client.getGameState().gameRunning && client.getGameState().winner === null && REGISTRATION.style.display === "none") {
        // hide game buttons, show registration
        REGISTRATION.style.display = "inherit";
        GAME_BUTTONS.style.display = "none";

        REGISTER_BUTTON.disabled = false;
        START_BUTTON.disabled = false;
        NAME_INPUT.disabled = false;
    }
}

/**
 * Register with the server. Disables name input and register button after running
 */
function register() {
    client.register(NAME_INPUT.value);

    REGISTER_BUTTON.disabled = true;
    NAME_INPUT.disabled = true;
}

/**
 * Starts the game. Disables the start button after running
 */
function startGame() {
    client.startGame();

    START_BUTTON.disabled = true;
}

/**
 * Discard a card from your hand
 * @param e Click event
 */
function discard(e: MouseEvent) {
    // if e.target is an <img>
    if (e.target instanceof HTMLImageElement) {
        // if the card is already active
        if (e.target.classList.contains("active")) {
            // remove active from all cards
            [...document.querySelectorAll(".card")].forEach(i => i.classList.remove("active"));
            // if color is wild open wild submit menu
            if (Number(e.target.dataset.color) === Uno.CardColors.CardColors.WILD) {
                WILD_SUBMIT.dataset.index = e.target.dataset.index;
                client.updateUI({ popup: PopupMode.WILD_BUTTONS });
            }
            // if color is not wild, discard the card as is
            else {
                client.discard(Number(e.target.dataset.index));
            }
        }
        // if card is not active, set it as active before discarding
        else {
            [...document.querySelectorAll(".card")].forEach(i => i.classList.remove("active"));
            e.target.classList.add("active");
        }
    }
}

/**
 * Sends a request to reset the game server side
 */
function resetGame() {
    client.resetGame();
    client.updateUI({ popup: PopupMode.HIDE });
}

/**
 * Sends a request to draw a card
 */
function drawCard() {
    client.discard(null);
}

/**
 * Submit for wild card
 * Sends a request to discard a wild card with a special color
 */
function submitWild() {
    let wildValue: Uno.CardColors.CardColors = -1;
    switch (WILD_SELECT.value) {
        case "RED":
            wildValue = Uno.CardColors.CardColors.RED;
            break;
        case "YELLOW":
            wildValue = Uno.CardColors.CardColors.YELLOW;
            break;
        case "GREEN":
            wildValue = Uno.CardColors.CardColors.GREEN;
            break;
        case "BLUE":
            wildValue = Uno.CardColors.CardColors.BLUE;
            break;
    }

    client.discard(Number(WILD_SUBMIT.dataset.index), wildValue);

    client.updateUI({ popup: PopupMode.HIDE });
}

// run update every second
setInterval(update, 1000);

// listeners for register buttons
START_BUTTON.addEventListener("click", startGame);
REGISTER_BUTTON.addEventListener("click", register);

// listener for hand container
// uses event delegation to act as an event listener for all cards in hand
HAND_CONTAINER.addEventListener("click", discard);

// reset game button listener
RESET_BUTTON.addEventListener("click", resetGame);
// draw card button listener
DRAW_CARD_BUTTON.addEventListener("click", drawCard);

// wild card submit button listener
WILD_SUBMIT.addEventListener("click", submitWild);
// wild card cancel button listener (just hides popup)
WILD_CANCEL.addEventListener("click", () => client.updateUI({ popup: PopupMode.HIDE }));
