/* ============================================================
   METROCITY V5
   Main Entry Point
   Existing index.html UI compatible
============================================================ */

import { RoadEngine } from "./RoadEngine.js";
import { BuildingEngine } from "./BuildingEngine.js";


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* --------------------------------------------------------
       CANVAS
    -------------------------------------------------------- */

    const canvas =
        document.getElementById("game");

    if (!canvas) {

        console.error(
            "MetroCity: #game canvas not found."
        );

        return;
    }


    const ctx =
        canvas.getContext("2d");


    if (!ctx) {

        console.error(
            "MetroCity: Canvas 2D context unavailable."
        );

        return;
    }


    /* --------------------------------------------------------
       CANVAS SIZE
    -------------------------------------------------------- */

    let width =
        window.innerWidth;

    let height =
        window.innerHeight;


    function resizeCanvas() {

        width =
            window.innerWidth;

        height =
            window.innerHeight;


        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );


        canvas.width =
            width * dpr;

        canvas.height =
            height * dpr;


        canvas.style.width =
            width + "px";

        canvas.style.height =
            height + "px";


        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }


    window.addEventListener(
        "resize",
        resizeCanvas
    );


    resizeCanvas();


    /* ========================================================
       CITY STATE
    ======================================================== */

    const city = {

        name:
            "New City",

        money:
            125000,

        population:
            1250,

        happiness:
            82,

        power:
            100,

        workers:
            0,

        currentTool:
            null,

        roads:
            [],

        buildings:
            [],

        intersections:
            [],

        statistics: {

            income:
                0,

            expenses:
                0,

            totalIncome:
                0,

            totalExpenses:
                0,

            buildingsBuilt:
                0,

            buildingsDemolished:
                0,

            roadsBuilt:
                0,

            playTime:
                0
        }
    };


    /* ========================================================
       CAMERA
    ======================================================== */

    const camera = {

        x:
            0,

        y:
            0,

        zoom:
            1,

        targetZoom:
            1,

        minZoom:
            0.45,

        maxZoom:
            3
    };


    /* ========================================================
       WORLD
    ======================================================== */

    const world = {

        size:
            2400
    };


    /* ========================================================
       ENGINES
    ======================================================== */

    const roadEngine =
        new RoadEngine(
            canvas,
            city,
            camera
        );


    const buildingEngine =
        new BuildingEngine(
            city,
            camera,
            canvas
        );


    /* ========================================================
       GLOBAL GAME OBJECT
    ======================================================== */

    window.metroCity = {

        canvas,

        ctx,

        city,

        camera,

        world,

        roadEngine,

        buildingEngine,

        running:
            true,

        paused:
            false,

        speed:
            1,

        selectedBuilding:
            null,

        saveGame,

        loadGame,

        newCity,

        setSpeed,

        pause,

        resume,

        togglePause,

        setTool,

        clearTool
    };


    window.game =
        window.metroCity;


    /* ========================================================
       BUILD MENU
    ======================================================== */

    const buildMenu =
        document.getElementById(
            "buildMenu"
        );


    const buildButton =
        document.getElementById(
            "buildButton"
        );


    const closeBuild =
        document.getElementById(
            "closeBuild"
        );


    buildButton?.addEventListener(
        "click",
        () => {

            buildMenu?.classList.toggle(
                "open"
            );
        }
    );


    closeBuild?.addEventListener(
        "click",
        () => {

            buildMenu?.classList.remove(
                "open"
            );
        }
    );


    /* ========================================================
       BUILD TOOL
    ======================================================== */

    document
        .querySelectorAll(
            ".build-item"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const tool =
                            button.dataset.tool;


                        setTool(
                            tool
                        );


                        document
                            .querySelectorAll(
                                ".build-item"
                            )
                            .forEach(
                                item => {

                                    item.classList
                                        .remove(
                                            "selected"
                                        );
                                }
                            );


                        button.classList.add(
                            "selected"
                        );


                        buildMenu?.classList
                            .remove(
                                "open"
                            );


                        updateToolIndicator(
                            tool
                        );
                    }
                );
            }
        );


    /* ========================================================
       TOOL SYSTEM
    ======================================================== */

    function setTool(
        tool
    ) {

        city.currentTool =
            tool;


        if (
            tool === "road"
        ) {

            if (
                typeof roadEngine
                    .setTool ===
                "function"
            ) {

                roadEngine.setTool(
                    "road"
                );
            }

        } else {

            if (
                typeof roadEngine
                    .setTool ===
                "function"
            ) {

                roadEngine.setTool(
                    null
                );
            }
        }


        updateToolIndicator(
            tool
        );
    }


    function clearTool() {

        city.currentTool =
            null;


        if (
            typeof roadEngine
                .setTool ===
            "function"
        ) {

            roadEngine.setTool(
                null
            );
        }


        document
            .querySelectorAll(
                ".build-item"
            )
            .forEach(
                item => {

                    item.classList
                        .remove(
                            "selected"
                        );
                }
            );


        updateToolIndicator(
            null
        );
    }


    /* ========================================================
       TOOL INDICATOR
    ======================================================== */

    function updateToolIndicator(
        tool
    ) {

        const indicator =
            document.getElementById(
                "toolIndicator"
            );


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
            "Tool: " +
            formatToolName(
                tool
            );


        indicator.classList.add(
            "show"
        );
    }


    function formatToolName(
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
                "Power Plant"
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
       BUILDING PANEL
    ======================================================== */

    let selectedBuilding =
        null;


    function openBuildingPanel(
        building
    ) {

        if (!building)
            return;


        selectedBuilding =
            building;


        window.metroCity
            .selectedBuilding =
            building;


        const data =
            BuildingEngine.TYPES?.[
                building.type
            ];


        if (!data)
            return;


        const icon =
            document.getElementById(
                "buildingIcon"
            );

        const name =
            document.getElementById(
                "buildingName"
            );

        const type =
            document.getElementById(
                "buildingType"
            );

        const level =
            document.getElementById(
                "buildingLevel"
            );

        const population =
            document.getElementById(
                "panelPopulation"
            );

        const workers =
            document.getElementById(
                "panelWorkers"
            );

        const happiness =
            document.getElementById(
                "panelHappiness"
            );

        const service =
            document.getElementById(
                "panelService"
            );


        if (icon)
            icon.textContent =
                data.icon || "🏢";


        if (name)
            name.textContent =
                data.name ||
                building.type;


        if (type)
            type.textContent =
                "City Infrastructure";


        if (level)
            level.innerHTML =
                `Level <strong>${
                    building.level || 1
                }</strong>`;


        if (population)
            population.textContent =
                Number(
                    building.population || 0
                ).toLocaleString();


        if (workers)
            workers.textContent =
                Number(
                    building.workers || 0
                ).toLocaleString();


        const happinessValue =
            building.happiness || 0;


        if (happiness)
            happiness.textContent =
                happinessValue >= 0
                    ? "+" +
                      happinessValue
                    : happinessValue;


        let coverage =
            0;


        try {

            if (
                typeof buildingEngine
                    .getServiceCoverage ===
                "function"
            ) {

                coverage =
                    buildingEngine
                        .getServiceCoverage(
                            building
                        );
            }

        } catch {

            coverage =
                0;
        }


        if (service) {

            service.textContent =
                coverage > 0
                    ? Number(
                        coverage
                    ).toLocaleString()
                    : "—";
        }


        document
            .getElementById(
                "buildingPanel"
            )
            ?.classList.add(
                "open"
            );
    }


    function closeBuildingPanel() {

        selectedBuilding =
            null;


        window.metroCity
            .selectedBuilding =
            null;


        if (
            buildingEngine
                .selectedBuilding !==
            undefined
        ) {

            buildingEngine
                .selectedBuilding =
                null;
        }


        document
            .getElementById(
                "buildingPanel"
            )
            ?.classList.remove(
                "open"
            );
    }


    document
        .getElementById(
            "closePanel"
        )
        ?.addEventListener(
            "click",
            closeBuildingPanel
        );


    /* ========================================================
       UPGRADE
    ======================================================== */

    document
        .getElementById(
            "upgradeBuilding"
        )
        ?.addEventListener(
            "click",
            () => {

                if (!selectedBuilding)
                    return;


                if (
                    typeof buildingEngine
                        .upgradeBuilding !==
                    "function"
                ) {

                    return;
                }


                const success =
                    buildingEngine
                        .upgradeBuilding(
                            selectedBuilding
                        );


                if (success) {

                    updateHUD();

                    openBuildingPanel(
                        selectedBuilding
                    );
                }
            }
        );


    /* ========================================================
       DEMOLISH
    ======================================================== */

    document
        .getElementById(
            "demolishBuilding"
        )
        ?.addEventListener(
            "click",
            () => {

                if (!selectedBuilding)
                    return;


                const confirmed =
                    window.confirm(
                        "Demolish this building?"
                    );


                if (!confirmed)
                    return;


                if (
                    typeof buildingEngine
                        .demolishBuilding ===
                    "function"
                ) {

                    buildingEngine
                        .demolishBuilding(
                            selectedBuilding
                        );
                }


                closeBuildingPanel();

                updateHUD();
            }
        );


    /* ========================================================
       CAMERA CONTROLS
    ======================================================== */

    document
        .getElementById(
            "zoomIn"
        )
        ?.addEventListener(
            "click",
            () => {

                camera.targetZoom =
                    Math.min(
                        camera.targetZoom *
                        1.25,
                        camera.maxZoom
                    );
            }
        );


    document
        .getElementById(
            "zoomOut"
        )
        ?.addEventListener(
            "click",
            () => {

                camera.targetZoom =
                    Math.max(
                        camera.targetZoom /
                        1.25,
                        camera.minZoom
                    );
            }
        );


    document
        .getElementById(
            "resetCamera"
        )
        ?.addEventListener(
            "click",
            () => {

                camera.x =
                    0;

                camera.y =
                    0;

                camera.targetZoom =
                    1;
            }
        );


    /* ========================================================
       CAMERA DRAG
    ======================================================== */

    let cameraPointer =
        null;


    let didDrag =
        false;


    canvas.addEventListener(
        "pointerdown",
        event => {

            /*
             * Building / road tools
             * control the pointer.
             */

            if (
                city.currentTool
            ) {

                return;
            }


            cameraPointer = {

                id:
                    event.pointerId,

                x:
                    event.clientX,

                y:
                    event.clientY
            };


            didDrag =
                false;


            canvas.setPointerCapture?.(
                event.pointerId
            );
        }
    );


    canvas.addEventListener(
        "pointermove",
        event => {

            if (!cameraPointer)
                return;


            if (
                event.pointerId !==
                cameraPointer.id
            ) {

                return;
            }


            const dx =
                event.clientX -
                cameraPointer.x;


            const dy =
                event.clientY -
                cameraPointer.y;


            if (
                Math.abs(dx) > 1 ||
                Math.abs(dy) > 1
            ) {

                didDrag =
                    true;
            }


            camera.x +=
                dx;

            camera.y +=
                dy;


            cameraPointer.x =
                event.clientX;

            cameraPointer.y =
                event.clientY;
        }
    );


    function stopCameraDrag() {

        cameraPointer =
            null;
    }


    canvas.addEventListener(
        "pointerup",
        stopCameraDrag
    );


    canvas.addEventListener(
        "pointercancel",
        stopCameraDrag
    );


    /* ========================================================
       BUILDING SELECT
    ======================================================== */

    canvas.addEventListener(
        "click",
        event => {

            if (
                city.currentTool
            ) {

                return;
            }


            if (didDrag) {

                didDrag =
                    false;

                return;
            }


            const rect =
                canvas.getBoundingClientRect();


            const screenX =
                event.clientX -
                rect.left;


            const screenY =
                event.clientY -
                rect.top;


            const worldPoint =
                screenToWorld(
                    screenX,
                    screenY
                );


            let building =
                null;


            try {

                if (
                    typeof buildingEngine
                        .findBuildingAt ===
                    "function"
                ) {

                    building =
                        buildingEngine
                            .findBuildingAt(
                                worldPoint.x,
                                worldPoint.y
                            );
                }

            } catch (error) {

                console.error(
                    "Building selection error:",
                    error
                );
            }


            if (building) {

                if (
                    typeof buildingEngine
                        .selectBuilding ===
                    "function"
                ) {

                    buildingEngine
                        .selectBuilding(
                            building
                        );
                }


                openBuildingPanel(
                    building
                );

            } else {

                closeBuildingPanel();
            }
        }
    );


    function screenToWorld(
        screenX,
        screenY
    ) {

        return {

            x:
                (
                    screenX -
                    width / 2 -
                    camera.x
                ) /
                camera.zoom,

            y:
                (
                    screenY -
                    height / 2 -
                    camera.y
                ) /
                camera.zoom
        };
    }


    /* ========================================================
       HUD
    ======================================================== */

    function updateHUD() {

        const money =
            document.getElementById(
                "money"
            );

        const population =
            document.getElementById(
                "population"
            );

        const happiness =
            document.getElementById(
                "happiness"
            );

        const power =
            document.getElementById(
                "power"
            );


        if (money) {

            money.textContent =
                "$" +
                Math.max(
                    0,
                    Math.floor(
                        city.money
                    )
                ).toLocaleString();
        }


        if (population) {

            population.textContent =
                Math.max(
                    0,
                    Math.floor(
                        city.population
                    )
                ).toLocaleString();
        }


        if (happiness) {

            happiness.textContent =
                Math.round(
                    city.happiness
                ) +
                "%";
        }


        if (power) {

            power.textContent =
                Math.round(
                    city.power
                ) +
                "%";
        }
    }


    /* ========================================================
       NOTIFICATION
    ======================================================== */

    let notificationTimer =
        null;


    function showNotification(
        title,
        text
    ) {

        const box =
            document.getElementById(
                "notification"
            );


        if (!box)
            return;


        const titleElement =
            document.getElementById(
                "notificationTitle"
            );


        const textElement =
            document.getElementById(
                "notificationText"
            );


        if (titleElement)
            titleElement.textContent =
                title;


        if (textElement)
            textElement.textContent =
                text;


        box.classList.add(
            "show"
        );


        clearTimeout(
            notificationTimer
        );


        notificationTimer =
            setTimeout(
                () => {

                    box.classList.remove(
                        "show"
                    );

                },
                2800
            );
    }


    /* ========================================================
       ENGINE EVENTS
    ======================================================== */

    window.addEventListener(
        "metrocity:notification",
        event => {

            const detail =
                event.detail || {};


            showNotification(
                detail.title ||
                    "MetroCity",

                detail.text ||
                    ""
            );
        }
    );


    window.addEventListener(
        "metrocity:buildingCreated",
        () => {

            updateHUD();
        }
    );


    window.addEventListener(
        "metrocity:buildingUpgraded",
        event => {

            updateHUD();


            if (
                selectedBuilding &&
                event.detail &&
                event.detail.id ===
                    selectedBuilding.id
            ) {

                openBuildingPanel(
                    selectedBuilding
                );
            }
        }
    );


    window.addEventListener(
        "metrocity:buildingDemolished",
        () => {

            updateHUD();
        }
    );


    window.addEventListener(
        "metrocity:roadCreated",
        () => {

            updateHUD();
        }
    );


    /* ========================================================
       SPEED
    ======================================================== */

    document
        .querySelectorAll(
            ".speed-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const value =
                            Number(
                                button.dataset.speed
                            );


                        setSpeed(
                            value
                        );


                        document
                            .querySelectorAll(
                                ".speed-btn"
                            )
                            .forEach(
                                item => {

                                    item.classList
                                        .remove(
                                            "active"
                                        );
                                }
                            );


                        button.classList.add(
                            "active"
                        );


                        showNotification(
                            "Simulation Speed",
                            `${value}× speed enabled.`
                        );
                    }
                );
            }
        );


    function setSpeed(
        value
    ) {

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

            value =
                1;
        }


        window.metroCity.speed =
            value;


        window.metroCitySpeed =
            value;


        /*
         * If engine supports speed.
         */

        if (
            typeof buildingEngine
                .setSpeed ===
            "function"
        ) {

            buildingEngine.setSpeed(
                value
            );
        }


        return value;
    }


    window.metroCitySpeed =
        1;


    /* ========================================================
       PAUSE / RESUME
    ======================================================== */

    function pause() {

        window.metroCity.paused =
            true;


        window.metroCitySpeed =
            0;


        showNotification(
            "Simulation Paused",
            "City simulation is paused."
        );
    }


    function resume() {

        window.metroCity.paused =
            false;


        window.metroCitySpeed =
            window.metroCity.speed ||
            1;


        showNotification(
            "Simulation Running",
            "City simulation resumed."
        );
    }


    function togglePause() {

        if (
            window.metroCity.paused
        ) {

            resume();

        } else {

            pause();
        }


        return window.metroCity.paused;
    }


    /* ========================================================
       SAVE GAME
    ======================================================== */

    function saveGame() {

        try {

            const saveData = {

                version:
                    5,

                city:
                    JSON.parse(
                        JSON.stringify(
                            city
                        )
                    ),

                camera: {

                    x:
                        camera.x,

                    y:
                        camera.y,

                    zoom:
                        camera.zoom,

                    targetZoom:
                        camera.targetZoom
                },

                speed:
                    window.metroCity.speed,

                savedAt:
                    Date.now()
            };


            localStorage.setItem(
                "metrocity_v5_save",
                JSON.stringify(
                    saveData
                )
            );


            showNotification(
                "Game Saved",
                "Your city has been saved successfully."
            );


            return true;

        } catch (error) {

            console.error(
                "Save failed:",
                error
            );


            showNotification(
                "Save Failed",
                "Unable to save your city."
            );


            return false;
        }
    }


    /* ========================================================
       LOAD GAME
    ======================================================== */

    function loadGame() {

        try {

            const raw =
                localStorage.getItem(
                    "metrocity_v5_save"
                );


            if (!raw) {

                showNotification(
                    "No Save Found",
                    "No saved city was found."
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
                    "Invalid save file."
                );
            }


            /*
             * Preserve existing object
             * references used by engines.
             */

            Object.keys(
                city
            ).forEach(
                key => {

                    delete city[key];
                }
            );


            Object.assign(
                city,
                data.city
            );


            /*
             * Restore camera.
             */

            if (
                data.camera
            ) {

                camera.x =
                    Number(
                        data.camera.x || 0
                    );

                camera.y =
                    Number(
                        data.camera.y || 0
                    );

                camera.zoom =
                    Number(
                        data.camera.zoom || 1
                    );

                camera.targetZoom =
                    Number(
                        data.camera.targetZoom || 1
                    );
            }


            setSpeed(
                Number(
                    data.speed || 1
                )
            );


            updateHUD();


            showNotification(
                "Game Loaded",
                "Your saved city has been restored."
            );


            return true;

        } catch (error) {

            console.error(
                "Load failed:",
                error
            );


            showNotification(
                "Load Failed",
                "The saved city could not be loaded."
            );


            return false;
        }
    }


    /* ========================================================
       NEW CITY
    ======================================================== */

    function newCity(
        name = "New City"
    ) {

        city.name =
            name;

        city.money =
            125000;

        city.population =
            1250;

        city.happiness =
            82;

        city.power =
            100;

        city.workers =
            0;

        city.currentTool =
            null;

        city.roads =
            [];

        city.buildings =
            [];

        city.intersections =
            [];


        city.statistics = {

            income:
                0,

            expenses:
                0,

            totalIncome:
                0,

            totalExpenses:
                0,

            buildingsBuilt:
                0,

            buildingsDemolished:
                0,

            roadsBuilt:
                0,

            playTime:
                0
        };


        camera.x =
            0;

        camera.y =
            0;

        camera.zoom =
            1;

        camera.targetZoom =
            1;


        closeBuildingPanel();

        clearTool();

        updateHUD();


        showNotification(
            "New City",
            `${name} has been created.`
        );
    }


    /* ========================================================
       DRAW GROUND
    ======================================================== */

    function drawGround() {

        ctx.fillStyle =
            "#293c2f";


        ctx.fillRect(
            -world.size / 2,
            -world.size / 2,
            world.size,
            world.size
        );
    }


    /* ========================================================
       DRAW GRID
    ======================================================== */

    function drawGrid() {

        const gridSize =
            100;

        const range =
            1200;


        ctx.strokeStyle =
            "rgba(255,255,255,.035)";

        ctx.lineWidth =
            1;


        for (
            let x = -range;
            x <= range;
            x += gridSize
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x,
                -range
            );

            ctx.lineTo(
                x,
                range
            );

            ctx.stroke();
        }


        for (
            let y = -range;
            y <= range;
            y += gridSize
        ) {

            ctx.beginPath();

            ctx.moveTo(
                -range,
                y
            );

            ctx.lineTo(
                range,
                y
            );

            ctx.stroke();
        }
    }


    /* ========================================================
       DRAW ROADS
    ======================================================== */

    function drawRoads() {

        /*
         * RoadEngine can draw itself if
         * it exposes draw().
         */

        if (
            typeof roadEngine.draw ===
            "function"
        ) {

            roadEngine.draw(
                ctx
            );

            return;
        }


        /*
         * Fallback renderer.
         */

        for (
            const road
            of city.roads
        ) {

            if (
                !road ||
                !road.points ||
                road.points.length < 2
            ) {

                continue;
            }


            ctx.save();


            ctx.lineCap =
                "round";

            ctx.lineJoin =
                "round";


            ctx.strokeStyle =
                "#20262b";

            ctx.lineWidth =
                (road.width || 24);


            ctx.beginPath();


            road.points.forEach(
                (point, index) => {

                    if (
                        index === 0
                    ) {

                        ctx.moveTo(
                            point.x,
                            point.y
                        );

                    } else {

                        ctx.lineTo(
                            point.x,
                            point.y
                        );
                    }
                }
            );


            ctx.stroke();


            ctx.restore();
        }
    }


    /* ========================================================
       DRAW BUILDINGS
    ======================================================== */

    function drawBuildings() {

        if (
            typeof buildingEngine.draw ===
            "function"
        ) {

            buildingEngine.draw(
                ctx
            );

            return;
        }


        for (
            const building
            of city.buildings
        ) {

            const data =
                BuildingEngine.TYPES?.[
                    building.type
                ];


            if (!data)
                continue;


            ctx.save();


            ctx.translate(
                building.x,
                building.y
            );


            const size =
                building.size ||
                data.size ||
                40;


            ctx.fillStyle =
                data.color ||
                "#59636d";


            ctx.fillRect(
                -size / 2,
                -size / 2,
                size,
                size
            );


            ctx.font =
                `${Math.max(
                    12,
                    size * .45
                )}px Arial`;


            ctx.textAlign =
                "center";

            ctx.textBaseline =
                "middle";


            ctx.fillText(
                data.icon ||
                "🏢",
                0,
                0
            );


            ctx.restore();
        }
    }


    /* ========================================================
       DRAW LOOP
    ======================================================== */

    let lastTime =
        performance.now();


    function draw(
        timestamp
    ) {

        const delta =
            timestamp -
            lastTime;


        lastTime =
            timestamp;


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        ctx.fillStyle =
            "#101820";


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        ctx.save();


        ctx.translate(
            width / 2 +
            camera.x,

            height / 2 +
            camera.y
        );


        ctx.scale(
            camera.zoom,
            camera.zoom
        );


        drawGround();

        drawGrid();

        drawRoads();

        drawBuildings();


        /*
         * Building preview.
         */

        if (
            typeof buildingEngine
                .drawPreview ===
            "function"
        ) {

            buildingEngine.drawPreview(
                ctx
            );
        }


        /*
         * Road preview.
         */

        if (
            typeof roadEngine
                .drawPreview ===
            "function"
        ) {

            roadEngine.drawPreview(
                ctx
            );
        }


        /*
         * Selected building.
         */

        if (
            buildingEngine
                .selectedBuilding
        ) {

            const building =
                buildingEngine
                    .selectedBuilding;


            ctx.save();


            ctx.strokeStyle =
                "rgba(255,255,255,.95)";


            ctx.lineWidth =
                2;


            ctx.setLineDash([
                6,
                5
            ]);


            const size =
                building.size ||
                40;


            ctx.strokeRect(

                building.x -
                    size / 2 -
                    6,

                building.y -
                    size / 2 -
                    6,

                size + 12,

                size + 12
            );


            ctx.setLineDash([]);


            ctx.restore();
        }


        ctx.restore();


        /*
         * Smooth zoom.
         */

        camera.zoom +=
            (
                camera.targetZoom -
                camera.zoom
            ) *
            0.12;


        /*
         * Update statistics.
         */

        if (
            !window.metroCity.paused
        ) {

            city.statistics.playTime +=
                delta;
        }


        requestAnimationFrame(
            draw
        );
    }


    /* ========================================================
       INITIALIZE
    ======================================================== */

    updateHUD();


    showNotification(
        "Welcome to MetroCity",
        "Tap BUILD to start creating your city."
    );


    requestAnimationFrame(
        draw
    );


    console.log(
        "MetroCity V5 initialized successfully."
    );

});
