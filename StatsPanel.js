/* ============================================================
   METROCITY V5 — StatsPanel
============================================================ */

export class StatsPanel {

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
            "metrocityStatsPanel";


        this.panel.innerHTML = `

            <div class="mc-stats-head">

                <div>
                    <strong>
                        City Statistics
                    </strong>

                    <small>
                        Live simulation data
                    </small>
                </div>

                <button
                    type="button"
                    data-close
                >
                    ✕
                </button>

            </div>


            <div class="mc-stats-list">

                <div>
                    <span>Population</span>
                    <strong id="mcStatPopulation">0</strong>
                </div>

                <div>
                    <span>Workers</span>
                    <strong id="mcStatWorkers">0</strong>
                </div>

                <div>
                    <span>Employment</span>
                    <strong id="mcStatEmployment">0%</strong>
                </div>

                <div>
                    <span>Happiness</span>
                    <strong id="mcStatHappiness">0%</strong>
                </div>

                <div>
                    <span>Power</span>
                    <strong id="mcStatPower">0%</strong>
                </div>

                <div>
                    <span>Water</span>
                    <strong id="mcStatWater">0%</strong>
                </div>

                <div>
                    <span>Buildings</span>
                    <strong id="mcStatBuildings">0</strong>
                </div>

                <div>
                    <span>Roads</span>
                    <strong id="mcStatRoads">0</strong>
                </div>

                <div>
                    <span>Total Income</span>
                    <strong id="mcStatIncome">$0</strong>
                </div>

                <div>
                    <span>Total Expenses</span>
                    <strong id="mcStatExpenses">$0</strong>
                </div>

            </div>
        `;


        this.style();


        document.body.appendChild(
            this.panel
        );
    }


    style() {

        if (
            document.getElementById(
                "metrocityStatsStyle"
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "metrocityStatsStyle";


        style.textContent = `

            #metrocityStatsPanel {
                position:fixed;
                top:90px;
                left:50%;
                transform:
                    translateX(-50%)
                    translateY(-10px);
                width:min(430px,calc(100vw - 24px));
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
                z-index:620;
            }

            #metrocityStatsPanel.open {
                opacity:1;
                visibility:visible;
                pointer-events:auto;
                transform:
                    translateX(-50%)
                    translateY(0);
            }

            .mc-stats-head {
                display:flex;
                align-items:center;
                justify-content:space-between;
                margin-bottom:14px;
            }

            .mc-stats-head strong {
                display:block;
                font-size:17px;
                font-weight:900;
            }

            .mc-stats-head small {
                display:block;
                margin-top:3px;
                color:rgba(255,255,255,.42);
                font-size:10px;
            }

            .mc-stats-head button {
                width:34px;
                height:34px;
                border:0;
                border-radius:10px;
                background:rgba(255,255,255,.07);
                color:#fff;
            }

            .mc-stats-list {
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:7px;
            }

            .mc-stats-list div {
                padding:10px;
                border-radius:12px;
                background:rgba(255,255,255,.045);
            }

            .mc-stats-list span {
                display:block;
                color:rgba(255,255,255,.42);
                font-size:8px;
            }

            .mc-stats-list strong {
                display:block;
                margin-top:4px;
                font-size:13px;
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
                "statsButton"
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
            "metrocity:simulationTick",
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


        const stats =
            this.city.statistics ||
            {};


        this.set(
            "mcStatPopulation",
            Number(
                this.city.population || 0
            ).toLocaleString()
        );


        this.set(
            "mcStatWorkers",
            Number(
                this.city.workers || 0
            ).toLocaleString()
        );


        this.set(
            "mcStatEmployment",
            Math.round(
                this.city.employment || 0
            ) +
            "%"
        );


        this.set(
            "mcStatHappiness",
            Math.round(
                this.city.happiness || 0
            ) +
            "%"
        );


        this.set(
            "mcStatPower",
            Math.round(
                this.city.power || 0
            ) +
            "%"
        );


        this.set(
            "mcStatWater",
            Math.round(
                this.city.water ?? 0
            ) +
            "%"
        );


        this.set(
            "mcStatBuildings",
            this.city.buildings?.length ||
                0
        );


        this.set(
            "mcStatRoads",
            this.city.roads?.length ||
                0
        );


        this.set(
            "mcStatIncome",
            "$" +
            Math.round(
                stats.totalIncome || 0
            ).toLocaleString()
        );


        this.set(
            "mcStatExpenses",
            "$" +
            Math.round(
                stats.totalExpenses || 0
            ).toLocaleString()
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
