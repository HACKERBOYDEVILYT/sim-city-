/* ============================================================
   METROCITY V5 — CityPanel
============================================================ */

export class CityPanel {

    constructor(
        game = window.metroCity
    ) {

        this.game =
            game;

        this.city =
            game?.city || null;

        this.panel =
            null;

        this.create();

        this.bind();

        this.update();
    }


    create() {

        this.panel =
            document.createElement(
                "section"
            );


        this.panel.id =
            "metrocityCityPanel";


        this.panel.innerHTML = `

            <div class="mc-city-head">

                <div>
                    <strong id="mcCityName">
                        New City
                    </strong>

                    <small>
                        City overview
                    </small>
                </div>

                <button
                    type="button"
                    data-close
                >
                    ✕
                </button>

            </div>


            <div class="mc-city-grid">

                <div>
                    <span>💰 Treasury</span>
                    <strong id="mcCityMoney">$0</strong>
                </div>

                <div>
                    <span>👥 Population</span>
                    <strong id="mcCityPopulation">0</strong>
                </div>

                <div>
                    <span>😊 Happiness</span>
                    <strong id="mcCityHappiness">0%</strong>
                </div>

                <div>
                    <span>⚡ Power</span>
                    <strong id="mcCityPower">0%</strong>
                </div>

                <div>
                    <span>🏢 Buildings</span>
                    <strong id="mcCityBuildings">0</strong>
                </div>

                <div>
                    <span>🛣️ Roads</span>
                    <strong id="mcCityRoads">0</strong>
                </div>

            </div>
        `;


        this.style();


        document.body.appendChild(
            this.panel
        );
    }


    style() {

        const styleId =
            "metrocityCityPanelStyle";


        if (
            document.getElementById(
                styleId
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            styleId;


        style.textContent = `

            #metrocityCityPanel {
                position:fixed;
                left:50%;
                top:90px;
                transform:
                    translateX(-50%)
                    translateY(-10px);
                width:min(420px,calc(100vw - 24px));
                padding:16px;
                border-radius:20px;
                background:rgba(7,12,18,.97);
                border:1px solid rgba(255,255,255,.09);
                box-shadow:0 25px 70px rgba(0,0,0,.4);
                color:#fff;
                backdrop-filter:blur(20px);
                -webkit-backdrop-filter:blur(20px);
                opacity:0;
                visibility:hidden;
                pointer-events:none;
                transition:.22s ease;
                z-index:610;
            }

            #metrocityCityPanel.open {
                opacity:1;
                visibility:visible;
                pointer-events:auto;
                transform:
                    translateX(-50%)
                    translateY(0);
            }

            .mc-city-head {
                display:flex;
                align-items:center;
                justify-content:space-between;
                margin-bottom:14px;
            }

            .mc-city-head strong {
                display:block;
                font-size:17px;
                font-weight:900;
            }

            .mc-city-head small {
                display:block;
                margin-top:3px;
                color:rgba(255,255,255,.42);
                font-size:10px;
            }

            .mc-city-head button {
                width:34px;
                height:34px;
                border:0;
                border-radius:10px;
                background:rgba(255,255,255,.07);
                color:#fff;
            }

            .mc-city-grid {
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
            }

            .mc-city-grid div {
                padding:12px;
                border-radius:13px;
                background:rgba(255,255,255,.045);
                border:1px solid rgba(255,255,255,.04);
            }

            .mc-city-grid span {
                display:block;
                color:rgba(255,255,255,.43);
                font-size:9px;
            }

            .mc-city-grid strong {
                display:block;
                margin-top:5px;
                font-size:15px;
                font-weight:900;
            }
        `;


        document.head.appendChild(
            style
        );
    }


    bind() {

        document
            .getElementById(
                "cityButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    this.update();

                    this.open();

                }
            );


        this.panel
            ?.querySelector(
                "[data-close]"
            )
            ?.addEventListener(
                "click",
                () => {

                    this.close();
                }
            );


        window.addEventListener(
            "metrocity:cityUpdated",
            () => {

                this.update();
            }
        );


        window.addEventListener(
            "metrocity:buildingCreated",
            () => {

                this.update();
            }
        );


        window.addEventListener(
            "metrocity:buildingDemolished",
            () => {

                this.update();
            }
        );


        window.addEventListener(
            "metrocity:roadCreated",
            () => {

                this.update();
            }
        );
    }


    open() {

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


    update() {

        if (!this.city)
            return;


        this.set(
            "mcCityName",
            this.city.name ||
                "New City"
        );


        this.set(
            "mcCityMoney",
            "$" +
            Number(
                this.city.money || 0
            ).toLocaleString()
        );


        this.set(
            "mcCityPopulation",
            Number(
                this.city.population || 0
            ).toLocaleString()
        );


        this.set(
            "mcCityHappiness",
            Math.round(
                this.city.happiness || 0
            ) +
            "%"
        );


        this.set(
            "mcCityPower",
            Math.round(
                this.city.power || 0
            ) +
            "%"
        );


        this.set(
            "mcCityBuildings",
            this.city.buildings?.length ||
                0
        );


        this.set(
            "mcCityRoads",
            this.city.roads?.length ||
                0
        );
    }


    set(
        id,
        value
    ) {

        const element =
            this.panel?.querySelector(
                "#" + id
            );


        if (element) {

            element.textContent =
                value;
        }
    }


    destroy() {

        this.panel?.remove();

        this.panel =
            null;
    }

}
