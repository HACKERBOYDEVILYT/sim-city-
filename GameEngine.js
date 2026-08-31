/* ============================================================
   MetroCity V5 — GameEngine
   Main game controller
   State • Engines • Save/Load • Economy • Time • Events
============================================================ */

export class GameEngine {

    constructor(canvas) {

        this.canvas = canvas;

        /*
         * Main city state
         */

        this.city = this.createDefaultCity();

        /*
         * Game time
         */

        this.gameTime = {
            day: 1,
            hour: 8,
            minute: 0,
            speed: 1,
            paused: false
        };


        /*
         * Active tool
         */

        this.currentTool = null;


        /*
         * Selection
         */

        this.selectedObject = null;


        /*
         * Save settings
         */

        this.saveKey =
            "metrocity_v5_save";


        this.autoSaveInterval =
            null;


        /*
         * Engines are loaded dynamically
         * by init()
         */

        this.camera = null;
        this.roadEngine = null;
        this.buildingEngine = null;
        this.renderer = null;


        /*
         * Runtime
         */

        this.running = false;

        this.lastFrame =
            performance.now();

        this.accumulator = 0;


        /*
         * Bind global events
         */

        this.bindEvents();
    }


    /* ========================================================
       DEFAULT CITY
    ======================================================== */

    createDefaultCity() {

        return {

            name: "New City",

            money: 50000,

            population: 0,

            workers: 0,

            happiness: 70,

            power: 100,

            day: 1,

            year: 2026,

            buildings: [],

            roads: [],

            intersections: [],

            trees: [],

            vehicles: [],

            citizens: [],

            statistics: {

                income: 0,

                expenses: 0,

                totalIncome: 0,

                totalExpenses: 0,

                buildingsBuilt: 0,

                buildingsDemolished: 0,

                roadsBuilt: 0,

                playTime: 0

            }

        };
    }


    /* ========================================================
       INITIALIZE
    ======================================================== */

    async init() {

        /*
         * Dynamic imports keep this engine
         * compatible with modular projects.
         */

        let CameraEngine;
        let RoadEngine;
        let BuildingEngine;
        let CityRenderer;


        try {

            const cameraModule =
                await import(
                    "./CameraEngine.js"
                );

            CameraEngine =
                cameraModule.CameraEngine;


        } catch (error) {

            console.error(
                "CameraEngine failed:",
                error
            );

            throw error;
        }


        try {

            const roadModule =
                await import(
                    "./RoadEngine.js"
                );

            RoadEngine =
                roadModule.RoadEngine;


        } catch (error) {

            console.error(
                "RoadEngine failed:",
                error
            );

            throw error;
        }


        try {

            const buildingModule =
                await import(
                    "./BuildingEngine.js"
                );

            BuildingEngine =
                buildingModule.BuildingEngine;


        } catch (error) {

            console.error(
                "BuildingEngine failed:",
                error
            );

            throw error;
        }


        try {

            const rendererModule =
                await import(
                    "./CityRenderer.js"
                );

            CityRenderer =
                rendererModule.CityRenderer;


        } catch (error) {

            console.error(
                "CityRenderer failed:",
                error
            );

            throw error;
        }


        /*
         * Camera
         */

        this.camera =
            new CameraEngine(
                this.canvas,
                {
                    x: 0,
                    y: 0,
                    zoom: 0.85,
                    minZoom: 0.35,
                    maxZoom: 2.8,
                    worldWidth: 5000,
                    worldHeight: 5000
                }
            );


        /*
         * Road engine
         */

        this.roadEngine =
            new RoadEngine(
                this.city,
                this.camera,
                this.canvas
            );


        /*
         * Building engine
         */

        this.buildingEngine =
            new BuildingEngine(
                this.city,
                this.camera,
                this.canvas
            );


        /*
         * Renderer
         */

        this.renderer =
            new CityRenderer(
                this.canvas,
                this.city,
                this.camera,
                this.roadEngine,
                this.buildingEngine
            );


        /*
         * Make city available globally
         * for UI buttons and debugging.
         */

        window.metroCity =
            this;


        /*
         * Start game
         */

        this.running = true;

        this.startAutoSave();

        this.startLoop();


        /*
         * Initial UI update
         */

        this.emitState();


        console.log(
            "MetroCity V5 initialized successfully."
        );


        return this;
    }


    /* ========================================================
       MAIN LOOP
    ======================================================== */

    startLoop() {

        this.lastFrame =
            performance.now();


        const loop =
            timestamp => {

                if (
                    !this.running
                ) {

                    return;
                }


                const delta =
                    Math.min(
                        100,
                        timestamp -
                        this.lastFrame
                    );


                this.lastFrame =
                    timestamp;


                this.update(
                    delta
                );


                requestAnimationFrame(
                    loop
                );
            };


        requestAnimationFrame(
            loop
        );
    }


    /* ========================================================
       UPDATE
    ======================================================== */

    update(delta) {

        if (
            this.gameTime.paused
        ) {

            return;
        }


        const speed =
            this.gameTime.speed;


        /*
         * Convert real milliseconds
         * into game minutes.
         */

        const gameMinutes =
            (
                delta *
                0.025 *
                speed
            );


        this.gameTime.minute +=
            gameMinutes;


        this.city.statistics.playTime +=
            delta;


        /*
         * Minute rollover
         */

        while (
            this.gameTime.minute >=
            60
        ) {

            this.gameTime.minute -=
                60;

            this.gameTime.hour +=
                1;

            this.onGameHour();
        }


        /*
         * Day rollover
         */

        if (
            this.gameTime.hour >=
            24
        ) {

            this.gameTime.hour = 0;

            this.gameTime.day += 1;

            this.city.day =
                this.gameTime.day;

            this.onGameDay();
        }


        /*
         * Keep global speed
         * compatible with BuildingEngine.
         */

        window.metroCitySpeed =
            speed;


        /*
         * Update UI periodically.
         */

        this.accumulator +=
            delta;


        if (
            this.accumulator >=
            500
        ) {

            this.accumulator = 0;

            this.emitState();
        }
    }


    /* ========================================================
       GAME HOUR
    ======================================================== */

    onGameHour() {

        /*
         * Hourly city processing.
         */

        if (
            this.buildingEngine
        ) {

            this.buildingEngine
                .recalculateCity();
        }


        this.emit(
            "metrocity:hour",
            {
                hour:
                    this.gameTime.hour,

                day:
                    this.gameTime.day
            }
        );
    }


    /* ========================================================
       GAME DAY
    ======================================================== */

    onGameDay() {

        /*
         * Daily maintenance.
         */

        const maintenance =
            this.calculateDailyExpenses();


        this.city.money -=
            maintenance;


        this.city.statistics.expenses =
            maintenance;


        this.city.statistics.totalExpenses +=
            maintenance;


        /*
         * Prevent negative balance
         * from breaking the simulation.
         */

        if (
            this.city.money < 0
        ) {

            this.city.money = 0;
        }


        /*
         * Small happiness adjustment.
         */

        if (
            this.city.money === 0
        ) {

            this.city.happiness -=
                2;
        }


        if (
            this.city.happiness < 0
        ) {

            this.city.happiness = 0;
        }


        this.emit(
            "metrocity:day",
            {
                day:
                    this.gameTime.day,

                maintenance
            }
        );


        this.emitState();
    }


    /* ========================================================
       DAILY EXPENSE
    ======================================================== */

    calculateDailyExpenses() {

        let total = 0;


        /*
         * Building maintenance
         */

        for (
            const building
            of this.city.buildings
        ) {

            const maintenance =
                2 +
                (
                    building.level ||
                    1
                ) *
                1.5;


            total +=
                maintenance;
        }


        /*
         * Road maintenance
         */

        total +=
            this.city.roads.length *
            0.8;


        return Math.round(
            total
        );
    }


    /* ========================================================
       TOOL SYSTEM
    ======================================================== */

    setTool(
        tool
    ) {

        this.currentTool =
            tool;


        /*
         * Engines read city.currentTool.
         */

        this.city.currentTool =
            tool;


        this.selectedObject =
            null;


        this.emit(
            "metrocity:toolChanged",
            {
                tool
            }
        );
    }


    clearTool() {

        this.setTool(
            null
        );
    }


    /* ========================================================
       BUILDING TOOL
    ======================================================== */

    selectBuildingTool(
        type
    ) {

        if (
            !this.buildingEngine
        ) {

            return false;
        }


        if (
            !this.buildingEngine
                .constructor
                .TYPES[type]
        ) {

            console.warn(
                "Unknown building type:",
                type
            );

            return false;
        }


        this.setTool(
            type
        );


        return true;
    }


    /* ========================================================
       ROAD TOOL
    ======================================================== */

    selectRoadTool(
        roadType = "road"
    ) {

        this.setTool(
            roadType
        );


        return true;
    }


    /* ========================================================
       SELECT OBJECT
    ======================================================== */

    selectObject(
        object
    ) {

        this.selectedObject =
            object;


        if (
            object &&
            object.type &&
            this.buildingEngine
        ) {

            this.buildingEngine
                .selectBuilding(
                    object
                );
        }


        this.emit(
            "metrocity:selectionChanged",
            {
                object
            }
        );
    }


    /* ========================================================
       UPGRADE SELECTED
    ======================================================== */

    upgradeSelected() {

        if (
            !this.selectedObject
        ) {

            return false;
        }


        if (
            !this.buildingEngine
        ) {

            return false;
        }


        return this.buildingEngine
            .upgradeBuilding(
                this.selectedObject
            );
    }


    /* ========================================================
       DEMOLISH SELECTED
    ======================================================== */

    demolishSelected() {

        if (
            !this.selectedObject
        ) {

            return false;
        }


        if (
            !this.buildingEngine
        ) {

            return false;
        }


        const target =
            this.selectedObject;


        const result =
            this.buildingEngine
                .demolishBuilding(
                    target
                );


        if (
            result
        ) {

            this.city.statistics
                .buildingsDemolished += 1;

            this.selectedObject =
                null;

            this.emitState();
        }


        return result;
    }


    /* ========================================================
       PAUSE
    ======================================================== */

    pause() {

        this.gameTime.paused =
            true;


        this.emit(
            "metrocity:pause",
            {
                paused: true
            }
        );
    }


    /* ========================================================
       RESUME
    ======================================================== */

    resume() {

        this.gameTime.paused =
            false;


        this.emit(
            "metrocity:pause",
            {
                paused: false
            }
        );
    }


    /* ========================================================
       TOGGLE PAUSE
    ======================================================== */

    togglePause() {

        if (
            this.gameTime.paused
        ) {

            this.resume();

        } else {

            this.pause();
        }


        return this.gameTime.paused;
    }


    /* ========================================================
       SPEED
    ======================================================== */

    setSpeed(
        speed
    ) {

        const allowed = [
            0.5,
            1,
            2,
            4
        ];


        let closest =
            allowed[0];


        let difference =
            Math.abs(
                speed -
                closest
            );


        for (
            const value
            of allowed
        ) {

            const diff =
                Math.abs(
                    speed -
                    value
                );


            if (
                diff <
                difference
            ) {

                closest =
                    value;

                difference =
                    diff;
            }
        }


        this.gameTime.speed =
            closest;


        window.metroCitySpeed =
            closest;


        this.emit(
            "metrocity:speedChanged",
            {
                speed:
                    closest
            }
        );


        return closest;
    }


    /* ========================================================
       SAVE GAME
    ======================================================== */

    saveGame() {

        try {

            const saveData = {

                version: 5,

                city:
                    this.city,

                gameTime:
                    this.gameTime,

                savedAt:
                    Date.now()

            };


            localStorage.setItem(
                this.saveKey,
                JSON.stringify(
                    saveData
                )
            );


            this.notify(
                "Game Saved",
                "Your city has been saved successfully."
            );


            this.emit(
                "metrocity:saved"
            );


            return true;

        } catch (error) {

            console.error(
                "Save failed:",
                error
            );


            this.notify(
                "Save Failed",
                "Unable to save the city."
            );


            return false;
        }
    }


    /* ========================================================
       LOAD GAME
    ======================================================== */

    loadGame() {

        try {

            const raw =
                localStorage.getItem(
                    this.saveKey
                );


            if (!raw) {

                this.notify(
                    "No Save Found",
                    "There is no saved city yet."
                );

                return false;
            }


            const data =
                JSON.parse(
                    raw
                );


            if (
                !data ||
                !data.city
            ) {

                throw new Error(
                    "Invalid save data."
                );
            }


            /*
             * Merge instead of replacing
             * references completely.
             */

            this.city =
                this.mergeCity(
                    this.createDefaultCity(),
                    data.city
                );


            if (
                data.gameTime
            ) {

                this.gameTime =
                    {
                        ...this.gameTime,
                        ...data.gameTime
                    };
            }


            /*
             * Update engines with new
             * city reference.
             */

            if (
                this.roadEngine
            ) {

                this.roadEngine.city =
                    this.city;
            }


            if (
                this.buildingEngine
            ) {

                this.buildingEngine.city =
                    this.city;
            }


            if (
                this.renderer
            ) {

                this.renderer.city =
                    this.city;
            }


            window.metroCitySpeed =
                this.gameTime.speed;


            this.emitState();


            this.notify(
                "Game Loaded",
                "Your saved city has been restored."
            );


            this.emit(
                "metrocity:loaded"
            );


            return true;

        } catch (error) {

            console.error(
                "Load failed:",
                error
            );


            this.notify(
                "Load Failed",
                "The saved city could not be loaded."
            );


            return false;
        }
    }


    /* ========================================================
       MERGE CITY
    ======================================================== */

    mergeCity(
        base,
        saved
    ) {

        return {

            ...base,

            ...saved,

            statistics: {

                ...base.statistics,

                ...(saved.statistics || {})

            },

            buildings:
                Array.isArray(
                    saved.buildings
                )
                    ? saved.buildings
                    : [],

            roads:
                Array.isArray(
                    saved.roads
                )
                    ? saved.roads
                    : [],

            intersections:
                Array.isArray(
                    saved.intersections
                )
                    ? saved.intersections
                    : [],

            trees:
                Array.isArray(
                    saved.trees
                )
                    ? saved.trees
                    : [],

            vehicles:
                Array.isArray(
                    saved.vehicles
                )
                    ? saved.vehicles
                    : [],

            citizens:
                Array.isArray(
                    saved.citizens
                )
                    ? saved.citizens
                    : []

        };
    }


    /* ========================================================
       AUTO SAVE
    ======================================================== */

    startAutoSave() {

        this.stopAutoSave();


        this.autoSaveInterval =
            setInterval(
                () => {

                    if (
                        this.running
                    ) {

                        this.saveGame();
                    }

                },

                60000
            );
    }


    stopAutoSave() {

        if (
            this.autoSaveInterval
        ) {

            clearInterval(
                this.autoSaveInterval
            );

            this.autoSaveInterval =
                null;
        }
    }


    /* ========================================================
       NEW CITY
    ======================================================== */

    newCity(
        name = "New City"
    ) {

        this.city =
            this.createDefaultCity();


        this.city.name =
            name;


        this.gameTime = {

            day: 1,

            hour: 8,

            minute: 0,

            speed: 1,

            paused: false

        };


        /*
         * Update engine references.
         */

        if (
            this.roadEngine
        ) {

            this.roadEngine.city =
                this.city;
        }


        if (
            this.buildingEngine
        ) {

            this.buildingEngine.city =
                this.city;
        }


        if (
            this.renderer
        ) {

            this.renderer.city =
                this.city;
        }


        if (
            this.camera
        ) {

            this.camera.reset(
                0,
                0,
                0.85
            );
        }


        this.selectedObject =
            null;


        this.clearTool();


        this.emitState();


        this.notify(
            "New City",
            `${name} has been created.`
        );
    }


    /* ========================================================
       CITY STATS
    ======================================================== */

    getStats() {

        return {

            money:
                Math.round(
                    this.city.money
                ),

            population:
                Math.round(
                    this.city.population
                ),

            workers:
                Math.round(
                    this.city.workers
                ),

            happiness:
                Math.round(
                    this.city.happiness
                ),

            power:
                Math.round(
                    this.city.power
                ),

            buildings:
                this.city.buildings.length,

            roads:
                this.city.roads.length,

            day:
                this.gameTime.day,

            hour:
                this.gameTime.hour,

            minute:
                Math.floor(
                    this.gameTime.minute
                ),

            paused:
                this.gameTime.paused,

            speed:
                this.gameTime.speed

        };
    }


    /* ========================================================
       STATE EVENT
    ======================================================== */

    emitState() {

        this.emit(
            "metrocity:state",
            this.getStats()
        );
    }


    /* ========================================================
       EVENT HELPER
    ======================================================== */

    emit(
        name,
        detail = {}
    ) {

        window.dispatchEvent(
            new CustomEvent(
                name,
                {
                    detail
                }
            )
        );
    }


    /* ========================================================
       NOTIFICATION
    ======================================================== */

    notify(
        title,
        message
    ) {

        this.emit(
            "metrocity:notification",
            {
                title,
                text: message
            }
        );
    }


    /* ========================================================
       KEYBOARD
    ======================================================== */

    bindEvents() {

        window.addEventListener(
            "keydown",
            event => {

                /*
                 * Space = pause
                 */

                if (
                    event.code ===
                    "Space"
                ) {

                    /*
                     * Don't pause while
                     * typing in input.
                     */

                    const tag =
                        event.target?.tagName;


                    if (
                        tag !== "INPUT" &&
                        tag !== "TEXTAREA"
                    ) {

                        event.preventDefault();

                        this.togglePause();
                    }
                }


                /*
                 * Escape = clear tool
                 */

                if (
                    event.key ===
                    "Escape"
                ) {

                    this.clearTool();
                }


                /*
                 * Save
                 */

                if (
                    (
                        event.ctrlKey ||
                        event.metaKey
                    ) &&
                    event.key.toLowerCase() ===
                    "s"
                ) {

                    event.preventDefault();

                    this.saveGame();
                }
            }
        );
    }


    /* ========================================================
       DESTROY
    ======================================================== */

    destroy() {

        this.running =
            false;

        this.stopAutoSave();


        if (
            this.camera?.destroy
        ) {

            this.camera.destroy();
        }


        if (
            this.renderer?.destroy
        ) {

            this.renderer.destroy();
        }


        this.camera =
            null;

        this.roadEngine =
            null;

        this.buildingEngine =
            null;

        this.renderer =
            null;
    }

}
