/* ============================================================
   METROCITY V5 — SettingsPanel
============================================================ */

export class SettingsPanel {

    constructor(
        game = window.metroCity
    ) {

        this.game =
            game;

        this.city =
            game?.city || null;

        this.renderer =
            game?.renderer || null;

        this.saveManager =
            game?.saveManager || null;

        this.panel =
            null;

        this.create();

        this.bind();
    }


    create() {

        this.panel =
            document.createElement(
                "section"
            );


        this.panel.id =
            "metrocitySettingsPanel";


        this.panel.innerHTML = `

            <div class="mc-settings-head">

                <div>
                    <strong>Settings</strong>

                    <small>
                        Customize your city simulation
                    </small>
                </div>

                <button
                    type="button"
                    data-close
                >
                    ✕
                </button>

            </div>


            <div class="mc-setting-list">

                <label class="mc-setting">
                    <div>
                        <strong>Grid</strong>
                        <small>Show construction grid</small>
                    </div>

                    <input
                        type="checkbox"
                        id="mcSettingGrid"
                        checked
                    >
                </label>


                <label class="mc-setting">
                    <div>
                        <strong>Building Labels</strong>
                        <small>Show names above buildings</small>
                    </div>

                    <input
                        type="checkbox"
                        id="mcSettingLabels"
                        checked
                    >
                </label>


                <label class="mc-setting">
                    <div>
                        <strong>Building Shadows</strong>
                        <small>Enable visual shadows</small>
                    </div>

                    <input
                        type="checkbox"
                        id="mcSettingShadows"
                        checked
                    >
                </label>


                <label class="mc-setting">
                    <div>
                        <strong>Auto Save</strong>
                        <small>Save city automatically</small>
                    </div>

                    <input
                        type="checkbox"
                        id="mcSettingAutoSave"
                        checked
                    >
                </label>

            </div>


            <div class="mc-settings-actions">

                <button
                    type="button"
                    data-action="save"
                >
                    💾 Save Now
                </button>

                <button
                    type="button"
                    data-action="new"
                >
                    🏙️ New City
                </button>

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
                "metrocitySettingsStyle"
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "metrocitySettingsStyle";


        style.textContent = `

            #metrocitySettingsPanel {
                position:fixed;
                top:90px;
                right:14px;
                width:min(370px,calc(100vw - 28px));
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
                transform:translateY(-10px);
                transition:.22s ease;
                z-index:630;
            }

            #metrocitySettingsPanel.open {
                opacity:1;
                visibility:visible;
                pointer-events:auto;
                transform:translateY(0);
            }

            .mc-settings-head {
                display:flex;
                align-items:center;
                justify-content:space-between;
                margin-bottom:12px;
            }

            .mc-settings-head strong {
                display:block;
                font-size:17px;
                font-weight:900;
            }

            .mc-settings-head small {
                display:block;
                margin-top:3px;
                color:rgba(255,255,255,.42);
                font-size:10px;
            }

            .mc-settings-head button {
                width:34px;
                height:34px;
                border:0;
                border-radius:10px;
                background:rgba(255,255,255,.07);
                color:#fff;
            }

            .mc-setting-list {
                display:flex;
                flex-direction:column;
                gap:5px;
            }

            .mc-setting {
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                padding:11px;
                border-radius:12px;
                background:rgba(255,255,255,.045);
                cursor:pointer;
            }

            .mc-setting strong {
                display:block;
                font-size:11px;
            }

            .mc-setting small {
                display:block;
                margin-top:3px;
                color:rgba(255,255,255,.40);
                font-size:8px;
            }

            .mc-setting input {
                width:20px;
                height:20px;
                accent-color:white;
            }

            .mc-settings-actions {
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
                margin-top:12px;
            }

            .mc-settings-actions button {
                min-height:42px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:12px;
                background:rgba(255,255,255,.055);
                color:#fff;
                font-size:10px;
                font-weight:900;
            }

            @media(max-width:600px) {
                #metrocitySettingsPanel {
                    left:8px;
                    right:8px;
                    bottom:78px;
                    top:auto;
                    width:auto;
                }
            }
        `;


        document.head.appendChild(
            style
        );
    }


    bind() {

        document
            .getElementById(
                "settingsButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    this.toggle();

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


        this.panel
            ?.querySelector(
                "#mcSettingGrid"
            )
            ?.addEventListener(
                "change",
                event => {

                    this.renderer
                        ?.toggleGrid?.(
                            event.target.checked
                        );

                }
            );


        this.panel
            ?.querySelector(
                "#mcSettingLabels"
            )
            ?.addEventListener(
                "change",
                event => {

                    this.renderer
                        ?.toggleLabels?.(
                            event.target.checked
                        );

                }
            );


        this.panel
            ?.querySelector(
                "#mcSettingShadows"
            )
            ?.addEventListener(
                "change",
                event => {

                    this.renderer
                        ?.toggleShadows?.(
                            event.target.checked
                        );

                }
            );


        this.panel
            ?.querySelector(
                "#mcSettingAutoSave"
            )
            ?.addEventListener(
                "change",
                event => {

                    if (
                        this.saveManager
                    ) {

                        if (
                            event.target.checked
                        ) {

                            this.saveManager
                                .enableAutoSave?.();

                        } else {

                            this.saveManager
                                .disableAutoSave?.();

                        }
                    }

                }
            );


        this.panel
            ?.querySelector(
                '[data-action="save"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    this.game
                        ?.saveGame?.();

                    this.notify(
                        "Game Saved",
                        "Your city has been saved."
                    );
                }
            );


        this.panel
            ?.querySelector(
                '[data-action="new"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    const ok =
                        window.confirm(
                            "Start a new city? Your current city must be saved first."
                        );


                    if (!ok)
                        return;


                    this.game
                        ?.newCity?.(
                            "New City"
                        );


                    this.close();
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


    toggle() {

        this.panel
            ?.classList.toggle(
                "open"
            );

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
