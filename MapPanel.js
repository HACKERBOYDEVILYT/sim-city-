/* ============================================================
   METROCITY V5 — MapPanel
============================================================ */

export class MapPanel {

    constructor(
        game = window.metroCity
    ) {

        this.game =
            game;

        this.city =
            game?.city || null;

        this.camera =
            game?.camera || null;

        this.renderer =
            game?.renderer || null;

        this.panel =
            null;

        this.createPanel();

        this.bindButton();

    }


    bindButton() {

        const button =
            document.getElementById(
                "mapButton"
            );


        button?.addEventListener(
            "click",
            () => {

                this.open();
            }
        );
    }


    createPanel() {

        const panel =
            document.createElement(
                "section"
            );


        panel.id =
            "metrocityMapPanel";


        panel.innerHTML = `
            <div class="mc-panel-head">
                <div>
                    <strong>Map</strong>
                    <small>City map controls</small>
                </div>

                <button
                    type="button"
                    data-close
                >
                    ✕
                </button>
            </div>

            <div class="mc-map-actions">

                <button
                    type="button"
                    data-action="center"
                >
                    ◎ Center City
                </button>

                <button
                    type="button"
                    data-action="grid"
                >
                    ▦ Toggle Grid
                </button>

                <button
                    type="button"
                    data-action="labels"
                >
                    🏷 Toggle Labels
                </button>

                <button
                    type="button"
                    data-action="zoom"
                >
                    🔍 Fit City
                </button>

            </div>

            <div class="mc-map-info">

                <div>
                    <span>Buildings</span>
                    <strong id="mcMapBuildings">0</strong>
                </div>

                <div>
                    <span>Roads</span>
                    <strong id="mcMapRoads">0</strong>
                </div>

            </div>
        `;


        this.applyPanelStyle(
            panel
        );


        document.body.appendChild(
            panel
        );


        this.panel =
            panel;


        panel
            .querySelector(
                "[data-close]"
            )
            ?.addEventListener(
                "click",
                () => this.close()
            );


        panel
            .querySelector(
                '[data-action="center"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    this.center();

                }
            );


        panel
            .querySelector(
                '[data-action="grid"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    const result =
                        this.renderer?.toggleGrid?.();


                    this.notify(
                        "Grid",
                        result === false
                            ? "Grid disabled."
                            : "Grid toggled."
                    );
                }
            );


        panel
            .querySelector(
                '[data-action="labels"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    const result =
                        this.renderer?.toggleLabels?.();


                    this.notify(
                        "Labels",
                        result === false
                            ? "Labels disabled."
                            : "Labels toggled."
                    );
                }
            );


        panel
            .querySelector(
                '[data-action="zoom"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    this.fitCity();

                }
            );
    }


    applyPanelStyle(
        panel
    ) {

        panel.style.cssText = `
            position:fixed;
            top:90px;
            left:50%;
            transform:translateX(-50%) translateY(-10px);
            width:min(360px,calc(100vw - 24px));
            padding:16px;
            border:1px solid rgba(255,255,255,.09);
            border-radius:20px;
            background:rgba(7,12,18,.97);
            color:#fff;
            box-shadow:0 25px 70px rgba(0,0,0,.4);
            backdrop-filter:blur(20px);
            -webkit-backdrop-filter:blur(20px);
            opacity:0;
            visibility:hidden;
            pointer-events:none;
            transition:.22s ease;
            z-index:600;
        `;

        this.addStyles();
    }


    addStyles() {

        if (
            document.getElementById(
                "metroCityPanelStyles"
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "metroCityPanelStyles";


        style.textContent = `

            .mc-panel-head {
                display:flex;
                align-items:center;
                justify-content:space-between;
                margin-bottom:15px;
            }

            .mc-panel-head strong {
                display:block;
                font-size:16px;
                font-weight:900;
            }

            .mc-panel-head small {
                display:block;
                margin-top:3px;
                color:rgba(255,255,255,.42);
                font-size:10px;
            }

            .mc-panel-head button {
                width:34px;
                height:34px;
                border:0;
                border-radius:10px;
                background:rgba(255,255,255,.07);
                color:#fff;
                cursor:pointer;
            }

            .mc-map-actions {
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
            }

            .mc-map-actions button {
                min-height:44px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:12px;
                background:rgba(255,255,255,.045);
                color:#fff;
                font-size:11px;
                font-weight:800;
                cursor:pointer;
            }

            .mc-map-info {
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
                margin-top:12px;
            }

            .mc-map-info div {
                padding:11px;
                border-radius:12px;
                background:rgba(255,255,255,.04);
            }

            .mc-map-info span {
                display:block;
                color:rgba(255,255,255,.4);
                font-size:9px;
            }

            .mc-map-info strong {
                display:block;
                margin-top:4px;
                font-size:14px;
            }

            #metrocityMapPanel.open {
                opacity:1;
                visibility:visible;
                pointer-events:auto;
                transform:
                    translateX(-50%)
                    translateY(0);
            }

        `;


        document.head.appendChild(
            style
        );
    }


    open() {

        this.update();

        this.panel
            ?.classList.add(
                "open"
            );
    }


    close() {

        this.panel
            ?.classList.remove(
                "open"
            );
    }


    center() {

        if (!this.camera)
            return;


        this.camera.x = 0;

        this.camera.y = 0;

        this.camera.targetZoom =
            1;


        this.notify(
            "Map",
            "Camera centered on your city."
        );
    }


    fitCity() {

        const buildings =
            this.city?.buildings || [];


        const roads =
            this.city?.roads || [];


        if (
            buildings.length === 0 &&
            roads.length === 0
        ) {

            this.center();

            return;
        }


        /*
         * Basic city bounds.
         */

        const points = [];


        buildings.forEach(
            building => {

                points.push({
                    x:
                        building.x,

                    y:
                        building.y
                });

            }
        );


        roads.forEach(
            road => {

                points.push(
                    {
                        x: road.x1,
                        y: road.y1
                    },
                    {
                        x: road.x2,
                        y: road.y2
                    }
                );

            }
        );


        const xs =
            points.map(
                point => point.x
            );


        const ys =
            points.map(
                point => point.y
            );


        const minX =
            Math.min(
                ...xs
            );


        const maxX =
            Math.max(
                ...xs
            );


        const minY =
            Math.min(
                ...ys
            );


        const maxY =
            Math.max(
                ...ys
            );


        const centerX =
            (
                minX +
                maxX
            ) / 2;


        const centerY =
            (
                minY +
                maxY
            ) / 2;


        this.camera.x =
            -centerX *
            this.camera.zoom;


        this.camera.y =
            -centerY *
            this.camera.zoom;


        this.notify(
            "Map",
            "City fitted to map."
        );
    }


    update() {

        const buildings =
            this.city?.buildings?.length ||
            0;


        const roads =
            this.city?.roads?.length ||
            0;


        const buildingsEl =
            this.panel?.querySelector(
                "#mcMapBuildings"
            );


        const roadsEl =
            this.panel?.querySelector(
                "#mcMapRoads"
            );


        if (buildingsEl)
            buildingsEl.textContent =
                buildings;


        if (roadsEl)
            roadsEl.textContent =
                roads;
    }


    notify(
        title,
        text
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "metrocity:notification",
                {
                    detail: {
                        title,
                        text
                    }
                }
            )
        );
    }


    destroy() {

        this.panel?.remove();

        this.panel =
            null;
    }

}
