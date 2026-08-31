/* ============================================================
   METROCITY V5 — UIManager
   Professional UI Controller
   Compatible with existing MetroCity V5 index.html
============================================================ */

export class UIManager {

    constructor(game = window.metroCity) {

        this.game = game;

        this.city = game?.city || null;
        this.canvas = game?.canvas || null;

        this.buildingEngine =
            game?.buildingEngine || null;

        this.roadEngine =
            game?.roadEngine || null;

        this.notificationTimer = null;

        this.selectedBuilding = null;

        this.elements = {};

        this.cacheElements();

        this.bindEvents();

        this.bindGameEvents();

        this.updateAll();

    }


    /* ========================================================
       DOM CACHE
    ======================================================== */

    cacheElements() {

        const ids = [

            "money",
            "population",
            "happiness",
            "power",

            "buildMenu",
            "buildButton",
            "closeBuild",

            "buildingPanel",
            "closePanel",

            "buildingIcon",
            "buildingName",
            "buildingType",
            "buildingLevel",

            "panelPopulation",
            "panelWorkers",
            "panelHappiness",
            "panelService",

            "upgradeBuilding",
            "demolishBuilding",

            "toolIndicator",

            "notification",
            "notificationTitle",
            "notificationText",

            "zoomIn",
            "zoomOut",
            "resetCamera"
        ];


        ids.forEach(id => {

            this.elements[id] =
                document.getElementById(id);

        });


        this.buildItems =
            document.querySelectorAll(
                ".build-item"
            );


        this.speedButtons =
            document.querySelectorAll(
                ".speed-btn"
            );

    }


    /* ========================================================
       EVENT BINDING
    ======================================================== */

    bindEvents() {

        this.bindBuildMenu();

        this.bindBuildItems();

        this.bindBuildingPanel();

        this.bindCameraControls();

        this.bindSpeedControls();

        this.bindKeyboard();

    }


    /* ========================================================
       BUILD MENU
    ======================================================== */

    bindBuildMenu() {

        const {
            buildButton,
            closeBuild,
            buildMenu
        } = this.elements;


        buildButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                this.toggleBuildMenu();

            }
        );


        closeBuild?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                this.closeBuildMenu();

            }
        );


        document.addEventListener(
            "pointerdown",
            event => {

                if (!buildMenu)
                    return;


                if (
                    !buildMenu.classList.contains(
                        "open"
                    )
                ) {

                    return;
                }


                const target =
                    event.target;


                if (
                    buildButton?.contains(
                        target
                    )
                ) {

                    return;
                }


                if (
                    buildMenu.contains(
                        target
                    )
                ) {

                    return;
                }


                /*
                 * Don't aggressively close
                 * on mobile canvas interaction.
                 */

            }
        );

    }


    toggleBuildMenu() {

        const menu =
            this.elements.buildMenu;


        if (!menu)
            return;


        menu.classList.toggle(
            "open"
        );

    }


    openBuildMenu() {

        this.elements.buildMenu
            ?.classList.add(
                "open"
            );

    }


    closeBuildMenu() {

        this.elements.buildMenu
            ?.classList.remove(
                "open"
            );

    }


    /* ========================================================
       BUILD ITEMS
    ======================================================== */

    bindBuildItems() {

        this.buildItems.forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        const tool =
                            button.dataset.tool;


                        if (!tool)
                            return;


                        this.selectBuildTool(
                            tool
                        );

                    }
                );

            }
        );

    }


    selectBuildTool(tool) {

        if (
            !this.game ||
            typeof this.game.setTool !==
                "function"
        ) {

            return;

        }


        this.game.setTool(
            tool
        );


        this.buildItems.forEach(
            item => {

                item.classList.toggle(
                    "selected",
                    item.dataset.tool ===
                        tool
                );

            }
        );


        this.updateToolIndicator(
            tool
        );


        this.closeBuildMenu();

    }


    clearBuildSelection() {

        this.buildItems.forEach(
            item => {

                item.classList.remove(
                    "selected"
                );

            }
        );


        this.updateToolIndicator(
            null
        );

    }


    /* ========================================================
       BUILDING PANEL
    ======================================================== */

    bindBuildingPanel() {

        this.elements.closePanel
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    this.closeBuildingPanel();

                }
            );


        this.elements.upgradeBuilding
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    this.upgradeSelectedBuilding();

                }
            );


        this.elements.demolishBuilding
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    this.demolishSelectedBuilding();

                }
            );

    }


    openBuildingPanel(
        building
    ) {

        if (!building)
            return;


        this.selectedBuilding =
            building;


        if (this.game) {

            this.game.selectedBuilding =
                building;

        }


        if (this.buildingEngine) {

            this.buildingEngine
                .selectedBuilding =
                building;

        }


        const data =
            this.buildingEngine &&
            this.buildingEngine.constructor
                ?.TYPES?.[
                    building.type
                ];


        if (!data)
            return;


        this.setText(
            "buildingIcon",
            data.icon || "🏢"
        );


        this.setText(
            "buildingName",
            data.name ||
                building.type
        );


        this.setText(
            "buildingType",
            "City Infrastructure"
        );


        this.setHTML(
            "buildingLevel",
            `Level <strong>${
                building.level || 1
            }</strong>`
        );


        this.setText(
            "panelPopulation",
            this.formatNumber(
                building.population
            )
        );


        this.setText(
            "panelWorkers",
            this.formatNumber(
                building.workers
            )
        );


        const happiness =
            Number(
                building.happiness || 0
            );


        this.setText(
            "panelHappiness",
            happiness >= 0
                ? `+${happiness}`
                : `${happiness}`
        );


        let coverage = 0;


        try {

            if (
                this.buildingEngine &&
                typeof this.buildingEngine
                    .getServiceCoverage ===
                    "function"
            ) {

                coverage =
                    this.buildingEngine
                        .getServiceCoverage(
                            building
                        );

            }

        } catch {

            coverage = 0;

        }


        this.setText(
            "panelService",
            coverage > 0
                ? this.formatNumber(
                    coverage
                )
                : "—"
        );


        this.updateUpgradeButton(
            building,
            data
        );


        this.elements.buildingPanel
            ?.classList.add(
                "open"
            );

    }


    closeBuildingPanel() {

        this.selectedBuilding =
            null;


        if (this.game) {

            this.game.selectedBuilding =
                null;

        }


        if (this.buildingEngine) {

            this.buildingEngine
                .selectedBuilding =
                null;

        }


        this.elements.buildingPanel
            ?.classList.remove(
                "open"
            );

    }


    /* ========================================================
       UPGRADE
    ======================================================== */

    upgradeSelectedBuilding() {

        const building =
            this.selectedBuilding;


        if (!building)
            return;


        if (
            !this.buildingEngine ||
            typeof this.buildingEngine
                .upgradeBuilding !==
                "function"
        ) {

            return;

        }


        const success =
            this.buildingEngine
                .upgradeBuilding(
                    building
                );


        if (success) {

            this.updateHUD();

            this.openBuildingPanel(
                building
            );

        }

    }


    updateUpgradeButton(
        building,
        data
    ) {

        const button =
            this.elements
                .upgradeBuilding;


        if (!button)
            return;


        const level =
            Number(
                building.level || 1
            );


        const maxLevel = 5;


        if (
            level >= maxLevel
        ) {

            button.disabled =
                true;

            button.textContent =
                "MAX LEVEL";

            button.classList.add(
                "disabled"
            );

            return;

        }


        const cost =
            Math.round(
                data.cost *
                (
                    0.65 +
                    level *
                    0.55
                )
            );


        button.disabled =
            false;

        button.classList.remove(
            "disabled"
        );


        button.innerHTML =
            `Upgrade <span>$${cost.toLocaleString()}</span>`;

    }


    /* ========================================================
       DEMOLISH
    ======================================================== */

    demolishSelectedBuilding() {

        const building =
            this.selectedBuilding;


        if (!building)
            return;


        const data =
            this.buildingEngine
                ?.constructor
                ?.TYPES?.[
                    building.type
                ];


        const refund =
            Math.round(
                (
                    data?.cost || 0
                ) * 0.35
            );


        const name =
            data?.name ||
            "this building";


        const confirmed =
            window.confirm(
                `Demolish ${name}?\n\nRefund: $${refund.toLocaleString()}`
            );


        if (!confirmed)
            return;


        if (
            this.buildingEngine &&
            typeof this.buildingEngine
                .demolishBuilding ===
                "function"
        ) {

            this.buildingEngine
                .demolishBuilding(
                    building
                );

        }


        this.closeBuildingPanel();

        this.updateAll();

    }


    /* ========================================================
       CAMERA CONTROLS
    ======================================================== */

    bindCameraControls() {

        this.elements.zoomIn
            ?.addEventListener(
                "click",
                () => {

                    this.zoomIn();

                }
            );


        this.elements.zoomOut
            ?.addEventListener(
                "click",
                () => {

                    this.zoomOut();

                }
            );


        this.elements.resetCamera
            ?.addEventListener(
                "click",
                () => {

                    this.resetCamera();

                }
            );

    }


    zoomIn() {

        const camera =
            this.game?.camera;


        if (!camera)
            return;


        camera.targetZoom =
            Math.min(
                (
                    camera.targetZoom ||
                    camera.zoom ||
                    1
                ) * 1.25,

                camera.maxZoom ||
                3
            );

    }


    zoomOut() {

        const camera =
            this.game?.camera;


        if (!camera)
            return;


        camera.targetZoom =
            Math.max(
                (
                    camera.targetZoom ||
                    camera.zoom ||
                    1
                ) / 1.25,

                camera.minZoom ||
                0.45
            );

    }


    resetCamera() {

        const camera =
            this.game?.camera;


        if (!camera)
            return;


        camera.x = 0;

        camera.y = 0;

        camera.zoom = 1;

        camera.targetZoom = 1;


        this.showNotification(
            "Camera Reset",
            "Camera returned to city center."
        );

    }


    /* ========================================================
       SPEED CONTROLS
    ======================================================== */

    bindSpeedControls() {

        this.speedButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        const value =
                            Number(
                                button.dataset.speed
                            );


                        this.setSpeed(
                            value
                        );


                        this.speedButtons
                            .forEach(
                                item => {

                                    item.classList
                                        .toggle(
                                            "active",
                                            item ===
                                                button
                                        );

                                }
                            );

                    }
                );

            }
        );

    }


    setSpeed(value) {

        const allowed = [
            1,
            2,
            4,
            8
        ];


        if (
            !allowed.includes(
                value
            )
        ) {

            value = 1;

        }


        if (
            this.game &&
            typeof this.game.setSpeed ===
                "function"
        ) {

            this.game.setSpeed(
                value
            );

        } else {

            window.metroCitySpeed =
                value;

        }


        return value;

    }


    /* ========================================================
       KEYBOARD
    ======================================================== */

    bindKeyboard() {

        document.addEventListener(
            "keydown",
            event => {

                /*
                 * Don't trigger shortcuts
                 * while typing.
                 */

                const tag =
                    event.target?.tagName;


                if (
                    tag === "INPUT" ||
                    tag === "TEXTAREA" ||
                    tag === "SELECT"
                ) {

                    return;

                }


                switch (
                    event.key.toLowerCase()
                ) {

                    case "b":

                        this.openBuildMenu();

                        break;


                    case "escape":

                        this.closeBuildMenu();

                        this.closeBuildingPanel();

                        if (
                            this.game &&
                            typeof this.game
                                .clearTool ===
                            "function"
                        ) {

                            this.game.clearTool();

                        }

                        this.clearBuildSelection();

                        break;


                    case "1":

                        this.setSpeed(1);

                        break;


                    case "2":

                        this.setSpeed(2);

                        break;


                    case "4":

                        this.setSpeed(4);

                        break;


                    case "8":

                        this.setSpeed(8);

                        break;

                }

            }
        );

    }


    /* ========================================================
       TOOL INDICATOR
    ======================================================== */

    updateToolIndicator(
        tool
    ) {

        const indicator =
            this.elements
                .toolIndicator;


        if (!indicator)
            return;


        if (!tool) {

            indicator.classList.remove(
                "show"
            );

            indicator.textContent =
                "Tool: Select";

            return;

        }


        indicator.textContent =
            `Tool: ${this.formatToolName(
                tool
            )}`;


        indicator.classList.add(
            "show"
        );

    }


    formatToolName(
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
                "Police",

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
                .replace(
                    /\b\w/g,
                    char =>
                        char.toUpperCase()
                )
        );

    }


    /* ========================================================
       HUD
    ======================================================== */

    updateHUD() {

        const city =
            this.city;


        if (!city)
            return;


        this.setText(
            "money",
            "$" +
            Math.max(
                0,
                Math.floor(
                    Number(
                        city.money || 0
                    )
                )
            ).toLocaleString()
        );


        this.setText(
            "population",
            Math.max(
                0,
                Math.floor(
                    Number(
                        city.population || 0
                    )
                )
            ).toLocaleString()
        );


        this.setText(
            "happiness",
            `${Math.round(
                Number(
                    city.happiness || 0
                )
            )}%`
        );


        this.setText(
            "power",
            `${Math.round(
                Number(
                    city.power || 0
                )
            )}%`
        );

    }


    /* ========================================================
       NOTIFICATIONS
    ======================================================== */

    showNotification(
        title,
        text,
        duration = 2800
    ) {

        const box =
            this.elements
                .notification;


        if (!box)
            return;


        this.setText(
            "notificationTitle",
            title
        );


        this.setText(
            "notificationText",
            text
        );


        box.classList.add(
            "show"
        );


        clearTimeout(
            this.notificationTimer
        );


        this.notificationTimer =
            setTimeout(
                () => {

                    box.classList.remove(
                        "show"
                    );

                },
                duration
            );

    }


    /* ========================================================
       GAME EVENTS
    ======================================================== */

    bindGameEvents() {

        window.addEventListener(
            "metrocity:notification",
            event => {

                const detail =
                    event.detail || {};


                this.showNotification(
                    detail.title ||
                        "MetroCity",

                    detail.text ||
                        ""
                );

            }
        );


        window.addEventListener(
            "metrocity:cityUpdated",
            () => {

                this.updateHUD();

            }
        );


        window.addEventListener(
            "metrocity:buildingCreated",
            () => {

                this.updateHUD();

            }
        );


        window.addEventListener(
            "metrocity:buildingUpgraded",
            event => {

                this.updateHUD();


                const building =
                    event.detail;


                if (
                    building &&
                    this.selectedBuilding &&
                    building.id ===
                        this.selectedBuilding.id
                ) {

                    this.openBuildingPanel(
                        building
                    );

                }

            }
        );


        window.addEventListener(
            "metrocity:buildingDemolished",
            event => {

                this.updateHUD();


                const building =
                    event.detail;


                if (
                    building &&
                    this.selectedBuilding &&
                    building.id ===
                        this.selectedBuilding.id
                ) {

                    this.closeBuildingPanel();

                }

            }
        );


        window.addEventListener(
            "metrocity:roadCreated",
            () => {

                this.updateHUD();

            }
        );


        window.addEventListener(
            "metrocity:simulationTick",
            event => {

                this.updateHUD();

            }
        );

    }


    /* ========================================================
       GENERIC HELPERS
    ======================================================== */

    setText(
        id,
        value
    ) {

        const element =
            this.elements[id];


        if (element) {

            element.textContent =
                value;

        }

    }


    setHTML(
        id,
        value
    ) {

        const element =
            this.elements[id];


        if (element) {

            element.innerHTML =
                value;

        }

    }


    formatNumber(
        value
    ) {

        return Number(
            value || 0
        ).toLocaleString();

    }


    /* ========================================================
       UPDATE ALL
    ======================================================== */

    updateAll() {

        this.updateHUD();


        if (
            this.selectedBuilding
        ) {

            this.openBuildingPanel(
                this.selectedBuilding
            );

        }

    }


    /* ========================================================
       PUBLIC SELECTION API
    ======================================================== */

    selectBuilding(
        building
    ) {

        if (!building) {

            this.closeBuildingPanel();

            return;

        }


        if (
            this.buildingEngine &&
            typeof this.buildingEngine
                .selectBuilding ===
                "function"
        ) {

            this.buildingEngine
                .selectBuilding(
                    building
                );

        }


        this.openBuildingPanel(
            building
        );

    }


    /* ========================================================
       DESTROY
    ======================================================== */

    destroy() {

        clearTimeout(
            this.notificationTimer
        );


        this.selectedBuilding =
            null;

    }

}
