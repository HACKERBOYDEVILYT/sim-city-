/* ============================================================
   MetroCity V5 — Main Entry
============================================================ */

import { GameEngine } from "./GameEngine.js";

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const canvas =
            document.getElementById(
                "gameCanvas"
            );

        if (!canvas) {

            console.error(
                "MetroCity: #gameCanvas not found."
            );

            return;
        }


        try {

            const game =
                new GameEngine(
                    canvas
                );


            await game.init();


            /*
             * Make available globally.
             */

            window.game =
                game;

            window.metroCity =
                game;


            console.log(
                "MetroCity V5 ready."
            );


        } catch (error) {

            console.error(
                "MetroCity failed to start:",
                error
            );


            showStartupError(
                error
            );
        }

    }
);


/* ============================================================
   STARTUP ERROR
============================================================ */

function showStartupError(
    error
) {

    const message =
        document.createElement(
            "div"
        );


    message.style.position =
        "fixed";

    message.style.inset =
        "20px";

    message.style.zIndex =
        "999999";

    message.style.display =
        "flex";

    message.style.alignItems =
        "center";

    message.style.justifyContent =
        "center";

    message.style.padding =
        "24px";

    message.style.borderRadius =
        "18px";

    message.style.background =
        "#111820";

    message.style.color =
        "#ffffff";

    message.style.fontFamily =
        "system-ui, sans-serif";

    message.style.textAlign =
        "center";

    message.style.boxShadow =
        "0 20px 60px rgba(0,0,0,.5)";


    message.innerHTML = `
        <div>
            <div style="
                font-size:42px;
                margin-bottom:12px;
            ">
                ⚠️
            </div>

            <h2 style="
                margin:0 0 8px;
            ">
                MetroCity couldn't start
            </h2>

            <p style="
                opacity:.7;
                margin:0 0 14px;
            ">
                Check the browser console for
                the exact error.
            </p>

            <button
                onclick="location.reload()"
                style="
                    border:0;
                    border-radius:10px;
                    padding:11px 18px;
                    background:#ffffff;
                    color:#111820;
                    font-weight:700;
                    cursor:pointer;
                "
            >
                Reload Game
            </button>
        </div>
    `;


    document.body.appendChild(
        message
    );


    console.error(
        "MetroCity startup error:",
        error
    );
}
