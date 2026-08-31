/* ============================================================
   METROCITY V5
   main.js — FINAL PRODUCTION BUILD
   ------------------------------------------------------------
   Responsibilities:
   - Engine initialization
   - Renderer integration
   - UI integration
   - Input integration
   - Save/Load integration
   - Camera
   - Mobile touch support
   - Simulation loop
   - Responsive canvas
   - Performance throttling
   - Global MetroCity API
============================================================ */

import { BuildingEngine } from "./BuildingEngine.js";
import { CameraEngine } from "./CameraEngine.js";
import { CityRenderer } from "./CityRenderer.js";
import { GameEngine } from "./GameEngine.js";
import { RoadEngine } from "./RoadEngine.js";
import { Renderer } from "./Renderer.js";
import { UIManager } from "./UIManager.js";
import { SaveManager } from "./SaveManager.js";
import { InputManager } from "./InputManager.js";


/* ============================================================
   APP CONFIG
============================================================ */

const CONFIG = {

    version: 5,

    canvasId: "game",

    defaultCityName: "New City",

    startingMoney: 125000,

    startingPopulation: 1250,

    startingHappiness: 82,

    startingPower: 100,

    worldSize: 2400,

    minZoom: 0.45,

    maxZoom: 3,

    defaultZoom: 1,

    speeds: [1, 2, 4, 8],

    simulationInterval: 5000,

    maxDelta: 100,

    maxDPR: 2,

    autosave: true,

    autosaveInterval: 60000
};


/* ============================================================
   SAFE HELPERS
============================================================ */

function safeNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


function safeCall(
    object,
    method,
    ...args
) {

    try {

        if (
            object &&
            typeof object[method] === "function"
        ) {

            return object[method](...args);
        }

    } catch (error) {

        console.error(
            `MetroCity: ${method}() failed`,
            error
        );
    }

    return undefined;
}


function dispatch(
    name,
    detail = {}
) {

    try {

        window.dispatchEvent(
            new CustomEvent(
                name,
                {
                    detail
                }
            )
        );

    } catch (error) {

        console.warn(
            "MetroCity event failed:",
            name,
            error
        );
    }
}


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeMetroCity,
    {
        once: true
    }
);


/* ============================================================
   INITIALIZATION
============================================================ */

function initializeMetroCity() {

    if (
        window.__METROCITY_INITIALIZED__
    ) {

        console.warn(
            "MetroCity is already initialized."
        );

        return;
    }


    window.__METROCITY_INITIALIZED__ =
        true;


    /* --------------------------------------------------------
       CANVAS
    -------------------------------------------------------- */

    const canvas =
        document.getElementById(
            CONFIG.canvasId
        );


    if (!canvas) {

        console.error(
            "MetroCity: #game canvas was not found."
        );

        return;
    }


    const ctx =
        canvas.getContext(
            "2d",
            {
                alpha: false,
                desynchronized: true
            }
        );


    if (!ctx) {

        console.error(
            "MetroCity: Canvas 2D context unavailable."
        );

        return;
    }


    /* ========================================================
       CITY STATE
    ======================================================== */

    const city = createCity();


    /* ========================================================
       CAMERA
    ======================================================== */

    const camera = {

        x: 0,

        y: 0,

        zoom:
            CONFIG.defaultZoom,

        targetZoom:
            CONFIG.defaultZoom,

        minZoom:
            CONFIG.minZoom,

        maxZoom:
            CONFIG.maxZoom
    };


    /* ========================================================
       WORLD
    ======================================================== */

    const world = {

        size:
            CONFIG.worldSize,

        halfSize:
            CONFIG.worldSize / 2
    };


    /* ========================================================
       RUNTIME
    ======================================================== */

    const runtime = {

        running: true,

        paused: false,

        destroyed: false,

        speed: 1,

        frameCount: 0,

        lastFrame: performance.now(),

        lastSimulation: performance.now(),

        lastHUDUpdate: 0,

        lastAutosave: performance.now(),

        fps: 60,

        lowPerformanceMode: false
    };


    /* ========================================================
       CANVAS SIZE
    ======================================================== */

    const viewport = {

        width:
            window.innerWidth,

        height:
            window.innerHeight,

        dpr:
            1
    };


    function resizeCanvas() {

        viewport.width =
            Math.max(
                1,
                window.innerWidth
            );


        viewport.height =
            Math.max(
                1,
                window.innerHeight
            );


        viewport.dpr =
            Math.min(
                window.devicePixelRatio || 1,
                CONFIG.maxDPR
            );


        canvas.width =
            Math.floor(
                viewport.width *
                viewport.dpr
            );


        canvas.height =
            Math.floor(
                viewport.height *
                viewport.dpr
            );


        canvas.style.width =
            `${viewport.width}px`;


        canvas.style.height =
            `${viewport.height}px`;


        ctx.setTransform(
            viewport.dpr,
            0,
            0,
            viewport.dpr,
            0,
            0
        );


        ctx.imageSmoothingEnabled =
            true;


        dispatch(
            "metrocity:resize",
            {
                width:
                    viewport.width,

                height:
                    viewport.height,

                dpr:
                    viewport.dpr
            }
        );
    }


    window.addEventListener(
        "resize",
        resizeCanvas,
        {
            passive: true
        }
    );


    window.addEventListener(
        "orientationchange",
        () => {

            setTimeout(
                resizeCanvas,
                100
            );

        },
        {
            passive: true
        }
    );


    resizeCanvas();


    /* ========================================================
       ENGINES
    ======================================================== */

    let roadEngine = null;

    let buildingEngine = null;

    let renderer = null;

    let uiManager = null;

    let saveManager = null;

    let inputManager = null;


    /* ========================================================
       ROAD ENGINE
    ======================================================== */

    try {

        roadEngine =
            new RoadEngine(
                canvas,
                city,
                camera
            );

    } catch (error) {

        console.error(
            "MetroCity: RoadEngine initialization failed.",
            error
        );
    }


    /* ========================================================
       BUILDING ENGINE
    ======================================================== */

    try {

        buildingEngine =
            new BuildingEngine(
                city,
                camera,
                canvas
            );

    } catch (error) {

        console.error(
            "MetroCity: BuildingEngine initialization failed.",
            error
        );
    }


    /* ========================================================
       RENDERER
    ======================================================== */

    try {

        renderer =
            new Renderer(
                canvas,
                ctx,
                city,
                camera,
                world
            );

    } catch (error) {

        console.warn(
            "MetroCity: Renderer constructor compatibility fallback.",
            error
        );


        try {

            renderer =
                new Renderer({
                    canvas,
                    ctx,
                    city,
                    camera,
                    world
                });

        } catch (secondError) {

            console.error(
                "MetroCity: Renderer initialization failed.",
                secondError
            );
        }
    }


    /* ========================================================
       UI MANAGER
    ======================================================== */

    try {

        uiManager =
            new UIManager(
                city,
                camera,
                buildingEngine,
                roadEngine
            );

    } catch (error) {

        console.warn(
            "MetroCity: UIManager constructor compatibility fallback.",
            error
        );


        try {

            uiManager =
                new UIManager({
                    city,
                    camera,
                    buildingEngine,
                    roadEngine,
                    canvas
                });

        } catch (secondError) {

            console.warn(
                "MetroCity: UIManager unavailable.",
                secondError
            );
        }
    }


    /* ========================================================
       SAVE MANAGER
    ======================================================== */

    try {

        saveManager =
            new SaveManager(
                city,
                camera
            );

    } catch (error) {

        console.warn(
            "MetroCity: SaveManager constructor compatibility fallback.",
            error
        );


        try {

            saveManager =
                new SaveManager({
                    city,
                    camera,
                    version:
                        CONFIG.version
                });

        } catch (secondError) {

            console.warn(
                "MetroCity: SaveManager unavailable; local fallback enabled.",
                secondError
            );
        }
    }


    /* ========================================================
       INPUT MANAGER
    ======================================================== */

    try {

        inputManager =
            new InputManager(
                canvas,
                city,
                camera,
                buildingEngine,
                roadEngine
            );

    } catch (error) {

        console.warn(
            "MetroCity: InputManager constructor compatibility fallback.",
            error
        );


        try {

            inputManager =
                new InputManager({
                    canvas,
                    city,
                    camera,
                    buildingEngine,
                    roadEngine
                });

        } catch (secondError) {

            console.warn(
                "MetroCity: InputManager unavailable; built-in input enabled.",
                secondError
            );
        }
    }


    /* ========================================================
       GLOBAL GAME OBJECT
    ======================================================== */

    const metroCity = {

        version:
            CONFIG.version,

        canvas,

        ctx,

        city,

        camera,

        world,

        viewport,

        runtime,

        roadEngine,

        buildingEngine,

        renderer,

        uiManager,

        saveManager,

        inputManager,

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

        clearTool,

        zoomIn,

        zoomOut,

        resetCamera,

        centerCamera,

        destroy
    };


    window.metroCity =
        metroCity;


    window.game =
        metroCity;


    window.metroCitySpeed =
        1;


    /* ========================================================
       TOOL SYSTEM
    ======================================================== */

    function setTool(
        tool
    ) {

        if (
            tool !== null &&
            typeof tool !== "string"
        ) {

            return false;
        }


        city.currentTool =
            tool;


        safeCall(
            roadEngine,
            "setTool",
            tool === "road"
                ? "road"
                : null
        );


        safeCall(
            inputManager,
            "setTool",
            tool
        );


        safeCall(
            uiManager,
            "setTool",
            tool
        );


        updateToolIndicator(
            tool
        );


        dispatch(
            "metrocity:toolChanged",
            {
                tool
            }
        );


        return true;
    }


    function clearTool() {

        return setTool(
            null
        );
    }


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
                .replace(
                    /\b\w/g,
                    char =>
                        char.toUpperCase()
                )
        );
    }


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


                        if (!tool)
                            return;


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
                    }
                );
            }
        );


    /* ========================================================
       BUILDING SELECTION
    ======================================================== */

    let selectedBuilding =
        null;


    function selectBuilding(
        building
    ) {

        if (!building) {

            closeBuildingPanel();

            return;
        }


        selectedBuilding =
            building;


        metroCity.selectedBuilding =
            building;


        safeCall(
            buildingEngine,
            "selectBuilding",
            building
        );


        safeCall(
            uiManager,
            "selectBuilding",
            building
        );


        openBuildingPanel(
            building
        );


        dispatch(
            "metrocity:buildingSelected",
            {
                building
            }
        );
    }


    function openBuildingPanel(
        building
    ) {

        if (!building)
            return;


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
                    safeNumber(
                        building.level,
                        1
                    )
                }</strong>`;


        if (population)
            population.textContent =
                safeNumber(
                    building.population
                ).toLocaleString();


        if (workers)
            workers.textContent =
                safeNumber(
                    building.workers
                ).toLocaleString();


        if (happiness)
            happiness.textContent =
                safeNumber(
                    building.happiness
                ) >= 0

                    ? "+" +
                      safeNumber(
                          building.happiness
                      )

                    : safeNumber(
                        building.happiness
                      );


        let coverage = 0;


        try {

            coverage =
                safeNumber(
                    buildingEngine
                        ?.getServiceCoverage?.(
                            building
                        )
                );

        } catch {

            coverage = 0;
        }


        if (service) {

            service.textContent =
                coverage > 0
                    ? coverage.toLocaleString()
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


        metroCity.selectedBuilding =
            null;


        safeCall(
            buildingEngine,
            "selectBuilding",
            null
        );


        safeCall(
            uiManager,
            "closeBuildingPanel"
        );


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


                const result =
                    safeCall(
                        buildingEngine,
                        "upgradeBuilding",
                        selectedBuilding
                    );


                if (result) {

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


                safeCall(
                    buildingEngine,
                    "demolishBuilding",
                    selectedBuilding
                );


                closeBuildingPanel();

                updateHUD();
            }
        );


    /* ========================================================
       CAMERA
    ======================================================== */

    function zoomIn() {

        camera.targetZoom =
            clamp(
                camera.targetZoom * 1.25,
                camera.minZoom,
                camera.maxZoom
            );


        dispatch(
            "metrocity:cameraChanged",
            {
                camera
            }
        );
    }


    function zoomOut() {

        camera.targetZoom =
            clamp(
                camera.targetZoom / 1.25,
                camera.minZoom,
                camera.maxZoom
            );


        dispatch(
            "metrocity:cameraChanged",
            {
                camera
            }
        );
    }


    function resetCamera() {

        camera.x = 0;

        camera.y = 0;

        camera.zoom =
            CONFIG.defaultZoom;

        camera.targetZoom =
            CONFIG.defaultZoom;


        dispatch(
            "metrocity:cameraChanged",
            {
                camera
            }
        );
    }


    function centerCamera(
        x = 0,
        y = 0,
        zoom = 1
    ) {

        camera.x =
            safeNumber(x);


        camera.y =
            safeNumber(y);


        camera.targetZoom =
            clamp(
                safeNumber(
                    zoom,
                    1
                ),
                camera.minZoom,
                camera.maxZoom
            );
    }


    document
        .getElementById(
            "zoomIn"
        )
        ?.addEventListener(
            "click",
            zoomIn
        );


    document
        .getElementById(
            "zoomOut"
        )
        ?.addEventListener(
            "click",
            zoomOut
        );


    document
        .getElementById(
            "resetCamera"
        )
        ?.addEventListener(
            "click",
            resetCamera
        );


    /* ========================================================
       BUILT-IN MOBILE CAMERA
       Used only if InputManager doesn't own input.
    ======================================================== */

    let cameraPointer =
        null;


    let cameraDragging =
        false;


    let cameraStartX = 0;

    let cameraStartY = 0;


    function shouldUseFallbackInput() {

        return !inputManager;
    }


    function pointerDown(
        event
    ) {

        if (!shouldUseFallbackInput())
            return;


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


        cameraStartX =
            event.clientX;


        cameraStartY =
            event.clientY;


        cameraDragging =
            false;


        canvas.setPointerCapture?.(
            event.pointerId
        );
    }


    function pointerMove(
        event
    ) {

        if (!shouldUseFallbackInput())
            return;


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
            Math.abs(
                event.clientX -
                cameraStartX
            ) > 4 ||
            Math.abs(
                event.clientY -
                cameraStartY
            ) > 4
        ) {

            cameraDragging =
                true;
        }


        camera.x += dx;

        camera.y += dy;


        cameraPointer.x =
            event.clientX;


        cameraPointer.y =
            event.clientY;
    }


    function pointerUp() {

        cameraPointer =
            null;
    }


    canvas.addEventListener(
        "pointerdown",
        pointerDown,
        {
            passive: true
        }
    );


    canvas.addEventListener(
        "pointermove",
        pointerMove,
        {
            passive: true
        }
    );


    canvas.addEventListener(
        "pointerup",
        pointerUp,
        {
            passive: true
        }
    );


    canvas.addEventListener(
        "pointercancel",
        pointerUp,
        {
            passive: true
        }
    );


    /* ========================================================
       FALLBACK BUILDING SELECTION
    ======================================================== */

    canvas.addEventListener(
        "click",
        event => {

            if (!shouldUseFallbackInput())
                return;


            if (city.currentTool)
                return;


            if (cameraDragging) {

                cameraDragging =
                    false;

                return;
            }


            const point =
                screenToWorld(
                    event.clientX,
                    event.clientY
                );


            const building =
                safeCall(
                    buildingEngine,
                    "findBuildingAt",
                    point.x,
                    point.y
                );


            if (building) {

                selectBuilding(
                    building
                );

            } else {

                closeBuildingPanel();
            }
        }
    );


    /* ========================================================
       SCREEN → WORLD
    ======================================================== */

    function screenToWorld(
        screenX,
        screenY
    ) {

        const rect =
            canvas.getBoundingClientRect();


        const x =
            screenX -
            rect.left;


        const y =
            screenY -
            rect.top;


        return {

            x:
                (
                    x -
                    rect.width / 2 -
                    camera.x
                ) /
                camera.zoom,

            y:
                (
                    y -
                    rect.height / 2 -
                    camera.y
                ) /
                camera.zoom
        };
    }


    /* ========================================================
       HUD
    ======================================================== */

    function updateHUD(
        force = false
    ) {

        const now =
            performance.now();


        if (
            !force &&
            now -
            runtime.lastHUDUpdate <
            250
        ) {

            return;
        }


        runtime.lastHUDUpdate =
            now;


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
                        safeNumber(
                            city.money
                        )
                    )
                ).toLocaleString();
        }


        if (population) {

            population.textContent =
                Math.max(
                    0,
                    Math.floor(
                        safeNumber(
                            city.population
                        )
                    )
                ).toLocaleString();
        }


        if (happiness) {

            happiness.textContent =
                Math.round(
                    clamp(
                        safeNumber(
                            city.happiness
                        ),
                        0,
                        100
                    )
                ) +
                "%";
        }


        if (power) {

            power.textContent =
                Math.round(
                    clamp(
                        safeNumber(
                            city.power
                        ),
                        0,
                        100
                    )
                ) +
                "%";
        }


        safeCall(
            uiManager,
            "updateHUD"
        );
    }


    /* ========================================================
       NOTIFICATIONS
    ======================================================== */

    let notificationTimer =
        null;


    function showNotification(
        title,
        text
    ) {

        safeCall(
            uiManager,
            "notify",
            title,
            text
        );


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

    function onNotification(
        event
    ) {

        const detail =
            event.detail || {};


        showNotification(
            detail.title ||
                "MetroCity",

            detail.text ||
                ""
        );
    }


    function onBuildingCreated() {

        city.statistics.buildingsBuilt =
            safeNumber(
                city.statistics
                    ?.buildingsBuilt
            ) + 1;


        updateHUD(true);
    }


    function onBuildingUpgraded(
        event
    ) {

        updateHUD(true);


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


    function onBuildingDemolished() {

        city.statistics.buildingsDemolished =
            safeNumber(
                city.statistics
                    ?.buildingsDemolished
            ) + 1;


        updateHUD(true);
    }


    function onRoadCreated() {

        city.statistics.roadsBuilt =
            safeNumber(
                city.statistics
                    ?.roadsBuilt
            ) + 1;


        updateHUD(true);
    }


    function onCityUpdated() {

        updateHUD();
    }


    function onSimulationTick(
        event
    ) {

        const income =
            safeNumber(
                event.detail?.income
            );


        city.statistics.income =
            income;


        city.statistics.totalIncome =
            safeNumber(
                city.statistics
                    ?.totalIncome
            ) +
            income;


        updateHUD();
    }


    window.addEventListener(
        "metrocity:notification",
        onNotification
    );


    window.addEventListener(
        "metrocity:buildingCreated",
        onBuildingCreated
    );


    window.addEventListener(
        "metrocity:buildingUpgraded",
        onBuildingUpgraded
    );


    window.addEventListener(
        "metrocity:buildingDemolished",
        onBuildingDemolished
    );


    window.addEventListener(
        "metrocity:roadCreated",
        onRoadCreated
    );


    window.addEventListener(
        "metrocity:cityUpdated",
        onCityUpdated
    );


    window.addEventListener(
        "metrocity:simulationTick",
        onSimulationTick
    );


    /* ========================================================
       SPEED CONTROL
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

        if (
            !CONFIG.speeds.includes(
                value
            )
        ) {

            value = 1;
        }


        runtime.speed =
            value;


        metroCity.speed =
            value;


        window.metroCitySpeed =
            runtime.paused
                ? 0
                : value;


        safeCall(
            buildingEngine,
            "setSpeed",
            value
        );


        safeCall(
            inputManager,
            "setSpeed",
            value
        );


        dispatch(
            "metrocity:speedChanged",
            {
                speed:
                    value
            }
        );


        return value;
    }


    /* ========================================================
       PAUSE
    ======================================================== */

    function pause() {

        if (runtime.paused)
            return;


        runtime.paused =
            true;


        metroCity.paused =
            true;


        window.metroCitySpeed =
            0;


        safeCall(
            uiManager,
            "setPaused",
            true
        );


        dispatch(
            "metrocity:paused"
        );
    }


    function resume() {

        if (!runtime.paused)
            return;


        runtime.paused =
            false;


        metroCity.paused =
            false;


        window.metroCitySpeed =
            runtime.speed ||
            1;


        runtime.lastSimulation =
            performance.now();


        safeCall(
            uiManager,
            "setPaused",
            false
        );


        dispatch(
            "metrocity:resumed"
        );
    }


    function togglePause() {

        if (runtime.paused) {

            resume();

        } else {

            pause();
        }


        return runtime.paused;
    }


    /* ========================================================
       SAVE
    ======================================================== */

    function buildSaveData() {

        return {

            version:
                CONFIG.version,

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
                runtime.speed,

            savedAt:
                Date.now()
        };
    }


    function saveGame() {

        try {

            const data =
                buildSaveData();


            const managerResult =
                safeCall(
                    saveManager,
                    "save",
                    data
                );


            if (
                managerResult !==
                undefined
            ) {

                showNotification(
                    "Game Saved",
                    "Your city has been saved successfully."
                );


                return true;
            }


            localStorage.setItem(
                "metrocity_v5_save",
                JSON.stringify(
                    data
                )
            );


            showNotification(
                "Game Saved",
                "Your city has been saved successfully."
            );


            dispatch(
                "metrocity:gameSaved",
                {
                    data
                }
            );


            return true;

        } catch (error) {

            console.error(
                "MetroCity save failed:",
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
       LOAD
    ======================================================== */

    function loadGame() {

        try {

            let data =
                safeCall(
                    saveManager,
                    "load"
                );


            if (!data) {

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


                data =
                    JSON.parse(
                        raw
                    );
            }


            if (
                !data ||
                !data.city
            ) {

                throw new Error(
                    "Invalid save data."
                );
            }


            restoreCity(
                data.city
            );


            if (
                data.camera
            ) {

                camera.x =
                    safeNumber(
                        data.camera.x
                    );


                camera.y =
                    safeNumber(
                        data.camera.y
                    );


                camera.zoom =
                    clamp(
                        safeNumber(
                            data.camera.zoom,
                            1
                        ),
                        camera.minZoom,
                        camera.maxZoom
                    );


                camera.targetZoom =
                    clamp(
                        safeNumber(
                            data.camera.targetZoom,
                            camera.zoom
                        ),
                        camera.minZoom,
                        camera.maxZoom
                    );
            }


            setSpeed(
                safeNumber(
                    data.speed,
                    1
                )
            );


            clearTool();

            closeBuildingPanel();

            updateHUD(true);


            safeCall(
                roadEngine,
                "refresh"
            );


            safeCall(
                buildingEngine,
                "recalculateCity"
            );


            safeCall(
                renderer,
                "invalidate"
            );


            showNotification(
                "Game Loaded",
                "Your saved city has been restored."
            );


            dispatch(
                "metrocity:gameLoaded",
                {
                    data
                }
            );


            return true;

        } catch (error) {

            console.error(
                "MetroCity load failed:",
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
       RESTORE CITY
    ======================================================== */

    function restoreCity(
        source
    ) {

        const restored =
            source || {};


        city.name =
            restored.name ||
            CONFIG.defaultCityName;


        city.money =
            safeNumber(
                restored.money,
                CONFIG.startingMoney
            );


        city.population =
            safeNumber(
                restored.population,
                CONFIG.startingPopulation
            );


        city.happiness =
            safeNumber(
                restored.happiness,
                CONFIG.startingHappiness
            );


        city.power =
            safeNumber(
                restored.power,
                CONFIG.startingPower
            );


        city.workers =
            safeNumber(
                restored.workers,
                0
            );


        city.currentTool =
            null;


        city.roads =
            Array.isArray(
                restored.roads
            )
                ? restored.roads
                : [];


        city.buildings =
            Array.isArray(
                restored.buildings
            )
                ? restored.buildings
                : [];


        city.intersections =
            Array.isArray(
                restored.intersections
            )
                ? restored.intersections
                : [];


        city.statistics =
            normalizeStatistics(
                restored.statistics
            );
    }


    /* ========================================================
       NEW CITY
    ======================================================== */

    function newCity(
        name = CONFIG.defaultCityName
    ) {

        const cleanName =
            String(
                name || CONFIG.defaultCityName
            ).trim() ||
            CONFIG.defaultCityName;


        city.name =
            cleanName;


        city.money =
            CONFIG.startingMoney;


        city.population =
            CONFIG.startingPopulation;


        city.happiness =
            CONFIG.startingHappiness;


        city.power =
            CONFIG.startingPower;


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


        city.statistics =
            createStatistics();


        resetCamera();

        clearTool();

        closeBuildingPanel();


        safeCall(
            buildingEngine,
            "recalculateCity"
        );


        safeCall(
            roadEngine,
            "reset"
        );


        safeCall(
            roadEngine,
            "refresh"
        );


        safeCall(
            renderer,
            "invalidate"
        );


        updateHUD(true);


        showNotification(
            "New City",
            `${cleanName} has been created.`
        );


        dispatch(
            "metrocity:newCity",
            {
                name:
                    cleanName
            }
        );


        return true;
    }


    /* ========================================================
       AUTOSAVE
    ======================================================== */

    function autosave(
        timestamp
    ) {

        if (!CONFIG.autosave)
            return;


        if (runtime.paused)
            return;


        if (
            timestamp -
            runtime.lastAutosave <
            CONFIG.autosaveInterval
        ) {

            return;
        }


        runtime.lastAutosave =
            timestamp;


        try {

            const data =
                buildSaveData();


            localStorage.setItem(
                "metrocity_v5_autosave",
                JSON.stringify(
                    data
                )
            );


        } catch (error) {

            console.warn(
                "MetroCity autosave failed:",
                error
            );
        }
    }


    /* ========================================================
       SIMULATION SAFETY
    ======================================================== */

    function runSimulation(
        timestamp
    ) {

        if (runtime.paused)
            return;


        if (
            timestamp -
            runtime.lastSimulation <
            CONFIG.simulationInterval
        ) {

            return;
        }


        runtime.lastSimulation =
            timestamp;


        safeCall(
            buildingEngine,
            "simulate"
        );
    }


    /* ========================================================
       CAMERA SMOOTHING
    ======================================================== */

    function updateCamera() {

        const difference =
            camera.targetZoom -
            camera.zoom;


        if (
            Math.abs(
                difference
            ) < 0.0005
        ) {

            camera.zoom =
                camera.targetZoom;

            return;
        }


        camera.zoom +=
            difference *
            0.12;


        camera.zoom =
            clamp(
                camera.zoom,
                camera.minZoom,
                camera.maxZoom
            );
    }


    /* ========================================================
       RENDER FALLBACK
    ======================================================== */

    function fallbackRender() {

        ctx.clearRect(
            0,
            0,
            viewport.width,
            viewport.height
        );


        ctx.fillStyle =
            "#101820";


        ctx.fillRect(
            0,
            0,
            viewport.width,
            viewport.height
        );


        ctx.save();


        ctx.translate(
            viewport.width / 2 +
            camera.x,

            viewport.height / 2 +
            camera.y
        );


        ctx.scale(
            camera.zoom,
            camera.zoom
        );


        drawGroundFallback();

        drawGridFallback();

        drawRoadFallback();

        drawBuildingsFallback();


        safeCall(
            buildingEngine,
            "drawPreview",
            ctx
        );


        safeCall(
            roadEngine,
            "drawPreview",
            ctx
        );


        drawSelectionFallback();


        ctx.restore();
    }


    /* ========================================================
       GROUND
    ======================================================== */

    function drawGroundFallback() {

        ctx.fillStyle =
            "#293c2f";


        ctx.fillRect(
            -world.halfSize,
            -world.halfSize,
            world.size,
            world.size
        );
    }


    /* ========================================================
       GRID
    ======================================================== */

    function drawGridFallback() {

        const gridSize =
            100;


        const range =
            world.halfSize;


        ctx.strokeStyle =
            "rgba(255,255,255,.035)";


        ctx.lineWidth =
            1 / camera.zoom;


        ctx.beginPath();


        for (
            let x =
                -range;

            x <= range;

            x += gridSize
        ) {

            ctx.moveTo(
                x,
                -range
            );


            ctx.lineTo(
                x,
                range
            );
        }


        for (
            let y =
                -range;

            y <= range;

            y += gridSize
        ) {

            ctx.moveTo(
                -range,
                y
            );


            ctx.lineTo(
                range,
                y
            );
        }


        ctx.stroke();
    }


    /* ========================================================
       ROADS FALLBACK
    ======================================================== */

    function drawRoadFallback() {

        for (
            const road
            of city.roads
        ) {

            if (!road)
                continue;


            const points =
                Array.isArray(
                    road.points
                )

                    ? road.points

                    : (
                        road.x1 !== undefined
                            ? [
                                {
                                    x:
                                        road.x1,

                                    y:
                                        road.y1
                                },

                                {
                                    x:
                                        road.x2,

                                    y:
                                        road.y2
                                }
                            ]

                            : []
                    );


            if (
                points.length < 2
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
                safeNumber(
                    road.width,
                    24
                );


            ctx.beginPath();


            points.forEach(
                (
                    point,
                    index
                ) => {

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


            ctx.strokeStyle =
                "#596168";


            ctx.lineWidth =
                Math.max(
                    2,
                    safeNumber(
                        road.width,
                        24
                    ) * 0.08
                );


            ctx.stroke();


            ctx.restore();
        }
    }


    /* ========================================================
       BUILDINGS FALLBACK
    ======================================================== */

    function drawBuildingsFallback() {

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


            const size =
                safeNumber(
                    building.size,
                    data.size || 40
                );


            ctx.save();


            ctx.translate(
                safeNumber(
                    building.x
                ),

                safeNumber(
                    building.y
                )
            );


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
                    size * 0.42
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
       SELECTION FALLBACK
    ======================================================== */

    function drawSelectionFallback() {

        const building =
            buildingEngine
                ?.selectedBuilding;


        if (!building)
            return;


        const size =
            safeNumber(
                building.size,
                40
            );


        ctx.save();


        ctx.strokeStyle =
            "rgba(255,255,255,.95)";


        ctx.lineWidth =
            2 / camera.zoom;


        ctx.setLineDash([
            6 / camera.zoom,
            5 / camera.zoom
        ]);


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


    /* ========================================================
       RENDER
    ======================================================== */

    function render() {

        if (
            renderer &&
            typeof renderer.render ===
                "function"
        ) {

            try {

                renderer.render();

                return;

            } catch (error) {

                console.warn(
                    "Renderer.render() failed; using fallback.",
                    error
                );
            }
        }


        if (
            renderer &&
            typeof renderer.draw ===
                "function"
        ) {

            try {

                renderer.draw();

                return;

            } catch (error) {

                console.warn(
                    "Renderer.draw() failed; using fallback.",
                    error
                );
            }
        }


        fallbackRender();
    }


    /* ========================================================
       MAIN LOOP
    ======================================================== */

    function gameLoop(
        timestamp
    ) {

        if (
            runtime.destroyed
        ) {

            return;
        }


        const rawDelta =
            timestamp -
            runtime.lastFrame;


        runtime.lastFrame =
            timestamp;


        const delta =
            clamp(
                rawDelta,
                0,
                CONFIG.maxDelta
            );


        runtime.frameCount++;


        if (delta > 0) {

            const instantFPS =
                1000 / delta;


            runtime.fps +=
                (
                    instantFPS -
                    runtime.fps
                ) *
                0.05;
        }


        /*
         * Mobile performance safeguard.
         */

        runtime.lowPerformanceMode =
            runtime.fps < 28;


        updateCamera();

        runSimulation(
            timestamp
        );

        autosave(
            timestamp
        );


        /*
         * Renderer receives frame data
         * when supported.
         */

        safeCall(
            renderer,
            "update",
            delta
        );


        render();


        /*
         * HUD isn't updated every frame.
         */

        updateHUD();


        requestAnimationFrame(
            gameLoop
        );
    }


    /* ========================================================
       KEYBOARD SHORTCUTS
    ======================================================== */

    function handleKeyboard(
        event
    ) {

        if (
            event.target instanceof
            HTMLInputElement ||
            event.target instanceof
            HTMLTextAreaElement
        ) {

            return;
        }


        switch (
            event.key.toLowerCase()
        ) {

            case "escape":

                clearTool();

                closeBuildingPanel();

                break;


            case "b":

                buildMenu?.classList.toggle(
                    "open"
                );

                break;


            case "p":

                togglePause();

                break;


            case "+":

            case "=":

                zoomIn();

                break;


            case "-":

            case "_":

                zoomOut();

                break;


            case "0":

                resetCamera();

                break;


            case "1":

                setSpeed(1);

                break;


            case "2":

                setSpeed(2);

                break;


            case "4":

                setSpeed(4);

                break;


            case "8":

                setSpeed(8);

                break;
        }
    }


    window.addEventListener(
        "keydown",
        handleKeyboard
    );


    /* ========================================================
       MOBILE PERFORMANCE
    ======================================================== */

    document.documentElement
        .style
        .setProperty(
            "touch-action",
            "none"
        );


    canvas.style.touchAction =
        "none";


    canvas.style.userSelect =
        "none";


    canvas.style.webkitUserSelect =
        "none";


    /*
     * Prevent accidental browser
     * scrolling while interacting
     * with the game.
     */

    canvas.addEventListener(
        "touchstart",
        event => {

            if (
                event.cancelable
            ) {

                event.preventDefault();
            }

        },
        {
            passive: false
        }
    );


    canvas.addEventListener(
        "touchmove",
        event => {

            if (
                event.cancelable
            ) {

                event.preventDefault();
            }

        },
        {
            passive: false
        }
    );


    /* ========================================================
       VISIBILITY
    ======================================================== */

    function handleVisibility() {

        if (
            document.hidden
        ) {

            runtime.lastFrame =
                performance.now();

            runtime.lastSimulation =
                performance.now();

            return;
        }


        runtime.lastFrame =
            performance.now();


        runtime.lastSimulation =
            performance.now();
    }


    document.addEventListener(
        "visibilitychange",
        handleVisibility
    );


    /* ========================================================
       DESTROY
    ======================================================== */

    function destroy() {

        if (
            runtime.destroyed
        ) {

            return;
        }


        runtime.destroyed =
            true;


        runtime.running =
            false;


        metroCity.running =
            false;


        clearTimeout(
            notificationTimer
        );


        window.removeEventListener(
            "resize",
            resizeCanvas
        );


        window.removeEventListener(
            "keydown",
            handleKeyboard
        );


        window.removeEventListener(
            "metrocity:notification",
            onNotification
        );


        window.removeEventListener(
            "metrocity:buildingCreated",
            onBuildingCreated
        );


        window.removeEventListener(
            "metrocity:buildingUpgraded",
            onBuildingUpgraded
        );


        window.removeEventListener(
            "metrocity:buildingDemolished",
            onBuildingDemolished
        );


        window.removeEventListener(
            "metrocity:roadCreated",
            onRoadCreated
        );


        window.removeEventListener(
            "metrocity:cityUpdated",
            onCityUpdated
        );


        window.removeEventListener(
            "metrocity:simulationTick",
            onSimulationTick
        );


        safeCall(
            inputManager,
            "destroy"
        );


        safeCall(
            uiManager,
            "destroy"
        );


        safeCall(
            renderer,
            "destroy"
        );


        safeCall(
            roadEngine,
            "destroy"
        );


        safeCall(
            buildingEngine,
            "destroy"
        );


        dispatch(
            "metrocity:destroyed"
        );
    }


    /* ========================================================
       INITIAL STATE
    ======================================================== */

    setSpeed(1);

    updateHUD(true);


    /*
     * Let engines perform their
     * initial calculation.
     */

    safeCall(
        buildingEngine,
        "recalculateCity"
    );


    safeCall(
        renderer,
        "resize",
        viewport.width,
        viewport.height,
        viewport.dpr
    );


    safeCall(
        uiManager,
        "init"
    );


    safeCall(
        inputManager,
        "init"
    );


    showNotification(
        "Welcome to MetroCity",
        "Tap BUILD to start creating your city."
    );


    dispatch(
        "metrocity:ready",
        {
            version:
                CONFIG.version
        }
    );


    /* ========================================================
       START LOOP
    ======================================================== */

    runtime.lastFrame =
        performance.now();


    runtime.lastSimulation =
        performance.now();


    runtime.lastAutosave =
        performance.now();


    requestAnimationFrame(
        gameLoop
    );


    console.log(
        `MetroCity V${CONFIG.version} initialized successfully.`
    );


    /* ========================================================
       LOCAL FUNCTIONS
    ======================================================== */

    function createCity() {

        return {

            name:
                CONFIG.defaultCityName,

            money:
                CONFIG.startingMoney,

            population:
                CONFIG.startingPopulation,

            happiness:
                CONFIG.startingHappiness,

            power:
                CONFIG.startingPower,

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

            statistics:
                createStatistics()
        };
    }


    function createStatistics() {

        return {

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
    }


    function normalizeStatistics(
        statistics
    ) {

        const defaults =
            createStatistics();


        const source =
            statistics || {};


        return {

            income:
                safeNumber(
                    source.income,
                    defaults.income
                ),

            expenses:
                safeNumber(
                    source.expenses,
                    defaults.expenses
                ),

            totalIncome:
                safeNumber(
                    source.totalIncome,
                    defaults.totalIncome
                ),

            totalExpenses:
                safeNumber(
                    source.totalExpenses,
                    defaults.totalExpenses
                ),

            buildingsBuilt:
                safeNumber(
                    source.buildingsBuilt,
                    defaults.buildingsBuilt
                ),

            buildingsDemolished:
                safeNumber(
                    source.buildingsDemolished,
                    defaults.buildingsDemolished
                ),

            roadsBuilt:
                safeNumber(
                    source.roadsBuilt,
                    defaults.roadsBuilt
                ),

            playTime:
                safeNumber(
                    source.playTime,
                    defaults.playTime
                )
        };
    }
}
