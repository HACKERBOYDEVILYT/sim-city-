/* ============================================================
   METROCITY V5 — BuildPanel
============================================================ */

export class BuildPanel {

    constructor(game = window.metroCity) {

        this.game = game;

        this.city =
            game?.city || null;

        this.menu =
            document.getElementById(
                "buildMenu"
            );

        this.button =
            document.getElementById(
                "buildButton"
            );

        this.closeButton =
            document.getElementById(
                "closeBuild"
            );

        this.items =
            document.querySelectorAll(
                ".build-item"
            );

        this.bind();
    }


    bind() {

        this.button?.addEventListener(
            "click",
            () => {

                this.toggle();
            }
        );


        this.closeButton?.addEventListener(
            "click",
            () => {

                this.close();
            }
        );


        this.items.forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        const tool =
                            item.dataset.tool;

                        if (!tool)
                            return;

                        this.selectTool(
                            tool,
                            item
                        );
                    }
                );
            }
        );
    }


    toggle() {

        this.menu?.classList.toggle(
            "open"
        );
    }


    open() {

        this.menu?.classList.add(
            "open"
        );
    }


    close() {

        this.menu?.classList.remove(
            "open"
        );
    }


    selectTool(
        tool,
        element
    ) {

        if (
            !this.city
        ) {
            return;
        }


        this.city.currentTool =
            tool;


        this.items.forEach(
            item => {

                item.classList.toggle(
                    "selected",
                    item === element
                );
            }
        );


        /*
         * Keep RoadEngine compatible.
         */

        try {

            if (
                this.game?.roadEngine &&
                typeof this.game.roadEngine
                    .setTool ===
                    "function"
            ) {

                this.game.roadEngine.setTool(
                    tool === "road"
                        ? "road"
                        : null
                );
            }

        } catch {}


        this.close();


        this.showToolIndicator(
            tool
        );


        window.dispatchEvent(
            new CustomEvent(
                "metrocity:buildToolChanged",
                {
                    detail: {
                        tool
                    }
                }
            )
        );
    }


    showToolIndicator(
        tool
    ) {

        const indicator =
            document.getElementById(
                "toolIndicator"
            );


        if (!indicator)
            return;


        indicator.textContent =
            `Tool: ${this.formatName(
                tool
            )}`;


        indicator.classList.add(
            "show"
        );
    }


    formatName(
        tool
    ) {

        const names = {

            road:
                "Road",

            house:
                "Residential",

            commercial:
                "Commercial",

            industrial:
                "Industrial",

            hospital:
                "Hospital",

            police:
                "Police Station",

            fire:
                "Fire Station",

            school:
                "School",

            park:
                "Park",

            power:
                "Power Plant",

            water:
                "Water Plant",

            stadium:
                "Stadium"
        };


        return (
            names[tool] ||
            String(tool)
                .replace(
                    /[-_]/g,
                    " "
                )
        );
    }


    clear() {

        if (this.city) {

            this.city.currentTool =
                null;
        }


        this.items.forEach(
            item => {

                item.classList.remove(
                    "selected"
                );
            }
        );


        const indicator =
            document.getElementById(
                "toolIndicator"
            );


        indicator?.classList.remove(
            "show"
        );
    }


    destroy() {

        this.menu = null;
        this.button = null;
        this.closeButton = null;
        this.items = [];
    }
}
