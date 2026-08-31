/* ============================================================
   METROCITY V5 — InputManager
   Professional PC + Mobile Input System

   Supports:
   - Mouse
   - Touch
   - Pointer Events
   - Keyboard
   - Camera pan
   - Camera zoom
   - Building placement
   - Road drawing
   - Building selection
   - Long press
   - Double tap
   - Pinch zoom
   - Two-finger camera pan
   - Tool shortcuts
   - Escape cancel
   - Mobile safe input
============================================================ */

export class InputManager {

    /* ========================================================
       CONFIG
    ======================================================== */

    static DRAG_THRESHOLD = 6;

    static LONG_PRESS_TIME = 500;

    static DOUBLE_TAP_TIME = 280;

    static PINCH_MIN_DISTANCE = 10;

    static ZOOM_FACTOR = 1.15;

    static KEY_PAN_SPEED = 18;

    static KEY_ZOOM_SPEED = 0.05;


    /* ========================================================
       CONSTRUCTOR
    ======================================================== */

    constructor(
        canvas,
        city,
        camera,
        options = {}
    ) {

        this.canvas =
            canvas;

        this.city =
            city;

        this.camera =
            camera;

        this.options =
            options;


        this.enabled =
            true;


        this.destroyed =
            false;


        /*
         * Pointer state.
         */

        this.pointers =
            new Map();


        this.primaryPointer =
            null;


        this.cameraDragging =
            false;


        this.didDrag =
            false;


        this.dragStart =
            null;


        this.lastPointer =
            null;


        /*
         * Touch state.
         */

        this.touchMode =
            null;


        this.pinchStartDistance =
            0;


        this.pinchStartZoom =
            1;


        this.pinchCenter =
            null;


        /*
         * Tap state.
         */

        this.lastTapTime =
            0;


        this.lastTapX =
            0;


        this.lastTapY =
            0;


        /*
         * Long press.
         */

        this.longPressTimer =
            null;


        this.longPressTriggered =
            false;


        /*
         * Keyboard.
         */

        this.keys =
            new Set();


        /*
         * Tool callback.
         */

        this.toolHandlers =
            {};


        this.listeners =
            [];


        this.setup();
    }


    /* ========================================================
       SETUP
    ======================================================== */

    setup() {

        if (!this.canvas) {

            console.error(
                "MetroCity InputManager: canvas missing."
            );

            return;
        }


        this.canvas.style.touchAction =
            "none";


        this.canvas.style.userSelect =
            "none";


        this.setupPointerEvents();

        this.setupWheel();

        this.setupKeyboard();

        this.setupContextMenu();

        this.setupWindowEvents();
    }


    /* ========================================================
       POINTER DOWN
    ======================================================== */

    setupPointerEvents() {

        this.addListener(
            this.canvas,
            "pointerdown",
            event =>
                this.onPointerDown(
                    event
                )
        );


        this.addListener(
            this.canvas,
            "pointermove",
            event =>
                this.onPointerMove(
                    event
                )
        );


        this.addListener(
            this.canvas,
            "pointerup",
            event =>
                this.onPointerUp(
                    event
                )
        );


        this.addListener(
            this.canvas,
            "pointercancel",
            event =>
                this.onPointerCancel(
                    event
                )
        );
    }


    /* ========================================================
       POINTER DOWN HANDLER
    ======================================================== */

    onPointerDown(
        event
    ) {

        if (
            !this.enabled ||
            this.destroyed
        ) {

            return;
        }


        event.preventDefault();


        try {

            this.canvas.setPointerCapture(
                event.pointerId
            );

        } catch {
            /*
             * Some mobile browsers can
             * reject pointer capture.
             */
        }


        const point =
            this.screenPoint(
                event.clientX,
                event.clientY
            );


        const pointer = {

            id:
                event.pointerId,

            type:
                event.pointerType,

            x:
                event.clientX,

            y:
                event.clientY,

            startX:
                event.clientX,

            startY:
                event.clientY,

            worldX:
                point.x,

            worldY:
                point.y,

            startWorldX:
                point.x,

            startWorldY:
                point.y,

            time:
                performance.now()
        };


        this.pointers.set(
            event.pointerId,
            pointer
        );


        /*
         * Multi-touch.
         */

        if (
            this.pointers.size >= 2
        ) {

            this.cancelLongPress();

            this.beginPinch();

            return;
        }


        this.primaryPointer =
            pointer;


        this.didDrag =
            false;


        this.dragStart = {

            x:
                event.clientX,

            y:
                event.clientY
        };


        /*
         * Building / road tools.
         */

        if (
            this.city?.currentTool
        ) {

            this.handleToolPointerDown(
                pointer
            );

        } else {

            /*
             * Start camera drag.
             */

            this.cameraDragging =
                true;
        }


        /*
         * Long press.
         */

        if (
            event.pointerType ===
            "touch"
        ) {

            this.startLongPress(
                pointer
            );
        }
    }


    /* ========================================================
       POINTER MOVE
    ======================================================== */

    onPointerMove(
        event
    ) {

        if (
            !this.enabled ||
            this.destroyed
        ) {

            return;
        }


        const pointer =
            this.pointers.get(
                event.pointerId
            );


        if (!pointer) {

            return;
        }


        const point =
            this.screenPoint(
                event.clientX,
                event.clientY
            );


        pointer.x =
            event.clientX;

        pointer.y =
            event.clientY;

        pointer.worldX =
            point.x;

        pointer.worldY =
            point.y;


        /*
         * Pinch.
         */

        if (
            this.pointers.size >= 2
        ) {

            this.updatePinch();

            return;
        }


        /*
         * Drag detection.
         */

        const dx =
            event.clientX -
            pointer.startX;


        const dy =
            event.clientY -
            pointer.startY;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        if (
            distance >
            InputManager.DRAG_THRESHOLD
        ) {

            this.didDrag =
                true;


            this.cancelLongPress();
        }


        /*
         * Tool handling.
         */

        if (
            this.city?.currentTool
        ) {

            this.handleToolPointerMove(
                pointer
            );

            return;
        }


        /*
         * Camera drag.
         */

        if (
            this.cameraDragging
        ) {

            this.panCamera(
                event.movementX ||
                event.clientX -
                    (
                        this.lastPointer?.x ||
                        event.clientX
                    ),

                event.movementY ||
                event.clientY -
                    (
                        this.lastPointer?.y ||
                        event.clientY
                    )
            );
        }


        this.lastPointer = {

            x:
                event.clientX,

            y:
                event.clientY
        };
    }


    /* ========================================================
       POINTER UP
    ======================================================== */

    onPointerUp(
        event
    ) {

        if (
            !this.enabled ||
            this.destroyed
        ) {

            return;
        }


        event.preventDefault();


        const pointer =
            this.pointers.get(
                event.pointerId
            );


        if (!pointer) {

            return;
        }


        this.cancelLongPress();


        /*
         * Tool handling.
         */

        if (
            this.city?.currentTool
        ) {

            this.handleToolPointerUp(
                pointer
            );
        }


        /*
         * Remove pointer.
         */

        this.pointers.delete(
            event.pointerId
        );


        /*
         * If pinch ended.
         */

        if (
            this.pointers.size < 2 &&
            this.touchMode ===
                "pinch"
        ) {

            this.touchMode =
                null;
        }


        /*
         * Camera drag finished.
         */

        if (
            this.pointers.size === 0
        ) {

            this.cameraDragging =
                false;

            this.lastPointer =
                null;
        }


        /*
         * Click / tap.
         */

        if (
            !this.didDrag &&
            !this.longPressTriggered &&
            !this.city?.currentTool
        ) {

            this.handleTap(
                pointer
            );
        }


        this.longPressTriggered =
            false;


        try {

            this.canvas.releasePointerCapture(
                event.pointerId
            );

        } catch {
            /*
             * Ignore.
             */
        }
    }


    /* ========================================================
       POINTER CANCEL
    ======================================================== */

    onPointerCancel(
        event
    ) {

        this.cancelLongPress();


        this.pointers.delete(
            event.pointerId
        );


        if (
            this.pointers.size === 0
        ) {

            this.cameraDragging =
                false;

            this.lastPointer =
                null;
        }
    }


    /* ========================================================
       TOOL POINTER DOWN
    ======================================================== */

    handleToolPointerDown(
        pointer
    ) {

        const tool =
            this.city.currentTool;


        if (!tool) {
            return;
        }


        /*
         * Road.
         */

        if (
            tool === "road"
        ) {

            this.callTool(
                "roadStart",
                pointer
            );

            return;
        }


        /*
         * Building.
         */

        this.callTool(
            "buildingPreview",
            pointer
        );
    }


    /* ========================================================
       TOOL POINTER MOVE
    ======================================================== */

    handleToolPointerMove(
        pointer
    ) {

        const tool =
            this.city.currentTool;


        if (!tool) {
            return;
        }


        if (
            tool === "road"
        ) {

            this.callTool(
                "roadMove",
                pointer
            );

            return;
        }


        this.callTool(
            "buildingPreview",
            pointer
        );
    }


    /* ========================================================
       TOOL POINTER UP
    ======================================================== */

    handleToolPointerUp(
        pointer
    ) {

        const tool =
            this.city.currentTool;


        if (!tool) {
            return;
        }


        if (
            tool === "road"
        ) {

            this.callTool(
                "roadEnd",
                pointer
            );

            return;
        }


        /*
         * Building placement.
         */

        if (
            !this.didDrag
        ) {

            this.callTool(
                "buildingPlace",
                pointer
            );
        }
    }


    /* ========================================================
       TOOL CALLBACK
    ======================================================== */

    callTool(
        action,
        pointer
    ) {

        const handler =
            this.toolHandlers[
                action
            ];


        if (
            typeof handler !==
            "function"
        ) {

            return;
        }


        try {

            handler(
                pointer
            );

        } catch (error) {

            console.error(
                `InputManager ${action} error:`,
                error
            );
        }
    }


    /* ========================================================
       REGISTER TOOL HANDLER
    ======================================================== */

    onTool(
        action,
        handler
    ) {

        if (
            typeof handler !==
            "function"
        ) {

            return;
        }


        this.toolHandlers[
            action
        ] =
            handler;
    }


    /* ========================================================
       CAMERA PAN
    ======================================================== */

    panCamera(
        dx,
        dy
    ) {

        if (!this.camera) {
            return;
        }


        const zoom =
            Math.max(
                0.01,
                this.camera.zoom || 1
            );


        /*
         * World movement should remain
         * consistent at different zoom.
         */

        this.camera.x +=
            dx;


        this.camera.y +=
            dy;


        this.dispatch(
            "metrocity:cameraMove",
            {
                x:
                    this.camera.x,

                y:
                    this.camera.y
            }
        );
    }


    /* ========================================================
       WHEEL
    ======================================================== */

    setupWheel() {

        this.addListener(
            this.canvas,
            "wheel",
            event => {

                if (
                    !this.enabled
                ) {

                    return;
                }


                event.preventDefault();


                const direction =
                    event.deltaY > 0
                        ? -1
                        : 1;


                this.zoomCamera(
                    direction,
                    event.clientX,
                    event.clientY
                );

            },
            {
                passive: false
            }
        );
    }


    /* ========================================================
       ZOOM CAMERA
    ======================================================== */

    zoomCamera(
        direction,
        screenX = null,
        screenY = null
    ) {

        if (!this.camera) {
            return;
        }


        const oldZoom =
            this.camera.targetZoom ??
            this.camera.zoom ??
            1;


        const factor =
            direction > 0
                ? InputManager.ZOOM_FACTOR
                : 1 /
                  InputManager.ZOOM_FACTOR;


        let newZoom =
            oldZoom *
            factor;


        const minZoom =
            this.camera.minZoom ??
            0.45;


        const maxZoom =
            this.camera.maxZoom ??
            3;


        newZoom =
            Math.max(
                minZoom,
                Math.min(
                    maxZoom,
                    newZoom
                )
            );


        /*
         * Zoom around pointer.
         */

        if (
            screenX !== null &&
            screenY !== null
        ) {

            this.zoomAroundPoint(
                oldZoom,
                newZoom,
                screenX,
                screenY
            );
        }


        this.camera.targetZoom =
            newZoom;


        this.dispatch(
            "metrocity:cameraZoom",
            {
                zoom:
                    newZoom
            }
        );
    }


    /* ========================================================
       ZOOM AROUND POINT
    ======================================================== */

    zoomAroundPoint(
        oldZoom,
        newZoom,
        screenX,
        screenY
    ) {

        if (
            !this.camera ||
            !this.canvas
        ) {

            return;
        }


        const rect =
            this.canvas.getBoundingClientRect();


        const width =
            rect.width;


        const height =
            rect.height;


        const oldWorldX =
            (
                screenX -
                rect.left -
                width / 2 -
                this.camera.x
            ) /
            oldZoom;


        const oldWorldY =
            (
                screenY -
                rect.top -
                height / 2 -
                this.camera.y
            ) /
            oldZoom;


        const newCameraX =
            screenX -
            rect.left -
            width / 2 -
            oldWorldX *
                newZoom;


        const newCameraY =
            screenY -
            rect.top -
            height / 2 -
            oldWorldY *
                newZoom;


        this.camera.x =
            newCameraX;


        this.camera.y =
            newCameraY;
    }


    /* ========================================================
       PINCH START
    ======================================================== */

    beginPinch() {

        const points =
            Array.from(
                this.pointers.values()
            );


        if (
            points.length < 2
        ) {

            return;
        }


        const a =
            points[0];


        const b =
            points[1];


        this.pinchStartDistance =
            this.distance(
                a.x,
                a.y,
                b.x,
                b.y
            );


        this.pinchStartZoom =
            this.camera?.targetZoom ||
            this.camera?.zoom ||
            1;


        this.pinchCenter = {

            x:
                (
                    a.x +
                    b.x
                ) / 2,

            y:
                (
                    a.y +
                    b.y
                ) / 2
        };


        this.touchMode =
            "pinch";
    }


    /* ========================================================
       PINCH UPDATE
    ======================================================== */

    updatePinch() {

        const points =
            Array.from(
                this.pointers.values()
            );


        if (
            points.length < 2
        ) {

            return;
        }


        const a =
            points[0];


        const b =
            points[1];


        const distance =
            this.distance(
                a.x,
                a.y,
                b.x,
                b.y
            );


        if (
            this.pinchStartDistance <
            InputManager.PINCH_MIN_DISTANCE
        ) {

            this.pinchStartDistance =
                distance;

            return;
        }


        const scale =
            distance /
            this.pinchStartDistance;


        let newZoom =
            this.pinchStartZoom *
            scale;


        const minZoom =
            this.camera?.minZoom ??
            0.45;


        const maxZoom =
            this.camera?.maxZoom ??
            3;


        newZoom =
            Math.max(
                minZoom,
                Math.min(
                    maxZoom,
                    newZoom
                )
            );


        const centerX =
            (
                a.x +
                b.x
            ) / 2;


        const centerY =
            (
                a.y +
                b.y
            ) / 2;


        this.zoomAroundPoint(
            this.camera.targetZoom ??
                this.camera.zoom ??
                1,

            newZoom,

            centerX,
            centerY
        );


        this.camera.targetZoom =
            newZoom;


        /*
         * Two-finger movement.
         */

        if (
            this.pinchCenter
        ) {

            const dx =
                centerX -
                this.pinchCenter.x;


            const dy =
                centerY -
                this.pinchCenter.y;


            if (
                Math.abs(dx) >
                    0.5 ||
                Math.abs(dy) >
                    0.5
            ) {

                this.camera.x +=
                    dx;

                this.camera.y +=
                    dy;
            }
        }


        this.pinchCenter = {

            x:
                centerX,

            y:
                centerY
        };


        this.didDrag =
            true;
    }


    /* ========================================================
       TAP
    ======================================================== */

    handleTap(
        pointer
    ) {

        const now =
            performance.now();


        const timeSinceLast =
            now -
            this.lastTapTime;


        const distance =
            this.distance(
                pointer.x,
                pointer.y,
                this.lastTapX,
                this.lastTapY
            );


        const doubleTap =
            timeSinceLast <=
                InputManager.DOUBLE_TAP_TIME &&
            distance <=
                InputManager.DRAG_THRESHOLD *
                2;


        if (doubleTap) {

            this.handleDoubleTap(
                pointer
            );


            this.lastTapTime =
                0;


            return;
        }


        this.lastTapTime =
            now;


        this.lastTapX =
            pointer.x;


        this.lastTapY =
            pointer.y;


        this.handleClick(
            pointer
        );
    }


    /* ========================================================
       CLICK / SELECT
    ======================================================== */

    handleClick(
        pointer
    ) {

        this.dispatch(
            "metrocity:inputClick",
            {
                x:
                    pointer.worldX,

                y:
                    pointer.worldY,

                screenX:
                    pointer.x,

                screenY:
                    pointer.y
            }
        );
    }


    /* ========================================================
       DOUBLE TAP
    ======================================================== */

    handleDoubleTap(
        pointer
    ) {

        /*
         * Default behavior:
         * zoom in around tapped point.
         */

        if (
            !this.city?.currentTool
        ) {

            this.zoomCamera(
                1,
                pointer.x,
                pointer.y
            );
        }


        this.dispatch(
            "metrocity:doubleTap",
            {
                x:
                    pointer.worldX,

                y:
                    pointer.worldY
            }
        );
    }


    /* ========================================================
       LONG PRESS
    ======================================================== */

    startLongPress(
        pointer
    ) {

        this.cancelLongPress();


        this.longPressTimer =
            setTimeout(
                () => {

                    if (
                        this.didDrag
                    ) {

                        return;
                    }


                    this.longPressTriggered =
                        true;


                    this.dispatch(
                        "metrocity:longPress",
                        {
                            x:
                                pointer.worldX,

                            y:
                                pointer.worldY,

                            screenX:
                                pointer.x,

                            screenY:
                                pointer.y
                        }
                    );

                },
                InputManager.LONG_PRESS_TIME
            );
    }


    /* ========================================================
       CANCEL LONG PRESS
    ======================================================== */

    cancelLongPress() {

        if (
            this.longPressTimer
        ) {

            clearTimeout(
                this.longPressTimer
            );


            this.longPressTimer =
                null;
        }
    }


    /* ========================================================
       KEYBOARD
    ======================================================== */

    setupKeyboard() {

        this.addListener(
            window,
            "keydown",
            event => {

                if (
                    !this.enabled
                ) {

                    return;
                }


                /*
                 * Don't interfere with
                 * text inputs.
                 */

                const target =
                    event.target;


                if (
                    target instanceof
                        HTMLInputElement ||
                    target instanceof
                        HTMLTextAreaElement ||
                    target?.isContentEditable
                ) {

                    return;
                }


                this.keys.add(
                    event.key.toLowerCase()
                );


                this.handleKeyDown(
                    event
                );

            }
        );


        this.addListener(
            window,
            "keyup",
            event => {

                this.keys.delete(
                    event.key.toLowerCase()
                );

            }
        );
    }


    /* ========================================================
       KEY DOWN
    ======================================================== */

    handleKeyDown(
        event
    ) {

        const key =
            event.key.toLowerCase();


        /*
         * Escape.
         */

        if (
            key === "escape"
        ) {

            this.cancelTool();


            this.dispatch(
                "metrocity:escape"
            );


            return;
        }


        /*
         * Building shortcuts.
         */

        const shortcuts = {

            "1":
                "house",

            "2":
                "commercial",

            "3":
                "industrial",

            "4":
                "hospital",

            "5":
                "police",

            "6":
                "fire",

            "7":
                "school",

            "8":
                "park",

            "9":
                "power",

            "0":
                "water"
        };


        if (
            shortcuts[key]
        ) {

            this.setTool(
                shortcuts[key]
            );


            return;
        }


        /*
         * Road.
         */

        if (
            key === "r"
        ) {

            this.setTool(
                "road"
            );


            return;
        }


        /*
         * Cancel.
         */

        if (
            key === "q"
        ) {

            this.cancelTool();


            return;
        }


        /*
         * Camera reset.
         */

        if (
            key === "home"
        ) {

            this.resetCamera();


            return;
        }


        /*
         * Zoom.
         */

        if (
            key === "+" ||
            key === "="
        ) {

            this.zoomCamera(
                1
            );


            return;
        }


        if (
            key === "-" ||
            key === "_"
        ) {

            this.zoomCamera(
                -1
            );


            return;
        }


        /*
         * Space = pause.
         */

        if (
            key === " "
        ) {

            event.preventDefault();


            if (
                this.game?.togglePause
            ) {

                this.game.togglePause();

            } else {

                this.dispatch(
                    "metrocity:togglePause"
                );
            }
        }
    }


    /* ========================================================
       KEYBOARD CAMERA UPDATE
    ======================================================== */

    update(
        delta = 16
    ) {

        if (
            !this.enabled ||
            !this.camera
        ) {

            return;
        }


        const multiplier =
            delta /
            16.67;


        let dx = 0;

        let dy = 0;


        if (
            this.keys.has("arrowleft") ||
            this.keys.has("a")
        ) {

            dx +=
                InputManager.KEY_PAN_SPEED;
        }


        if (
            this.keys.has("arrowright") ||
            this.keys.has("d")
        ) {

            dx -=
                InputManager.KEY_PAN_SPEED;
        }


        if (
            this.keys.has("arrowup") ||
            this.keys.has("w")
        ) {

            dy +=
                InputManager.KEY_PAN_SPEED;
        }


        if (
            this.keys.has("arrowdown") ||
            this.keys.has("s")
        ) {

            dy -=
                InputManager.KEY_PAN_SPEED;
        }


        if (
            dx !== 0 ||
            dy !== 0
        ) {

            this.panCamera(
                dx * multiplier,
                dy * multiplier
            );
        }
    }


    /* ========================================================
       SET TOOL
    ======================================================== */

    setTool(
        tool
    ) {

        if (
            this.city
        ) {

            this.city.currentTool =
                tool;
        }


        this.cancelLongPress();


        this.dispatch(
            "metrocity:toolChanged",
            {
                tool
            }
        );
    }


    /* ========================================================
       CANCEL TOOL
    ======================================================== */

    cancelTool() {

        if (
            this.city
        ) {

            this.city.currentTool =
                null;
        }


        this.cameraDragging =
            false;


        this.didDrag =
            false;


        this.cancelLongPress();


        this.dispatch(
            "metrocity:toolCancelled"
        );
    }


    /* ========================================================
       RESET CAMERA
    ======================================================== */

    resetCamera() {

        if (!this.camera) {
            return;
        }


        this.camera.x =
            0;


        this.camera.y =
            0;


        this.camera.targetZoom =
            1;


        this.dispatch(
            "metrocity:cameraReset"
        );
    }


    /* ========================================================
       SCREEN → WORLD
    ======================================================== */

    screenPoint(
        screenX,
        screenY
    ) {

        const rect =
            this.canvas.getBoundingClientRect();


        const width =
            rect.width;


        const height =
            rect.height;


        const zoom =
            this.camera?.zoom ||
            1;


        return {

            x:
                (
                    screenX -
                    rect.left -
                    width / 2 -
                    (
                        this.camera?.x ||
                        0
                    )
                ) /
                zoom,

            y:
                (
                    screenY -
                    rect.top -
                    height / 2 -
                    (
                        this.camera?.y ||
                        0
                    )
                ) /
                zoom
        };
    }


    /* ========================================================
       WORLD → SCREEN
    ======================================================== */

    worldPoint(
        worldX,
        worldY
    ) {

        const rect =
            this.canvas.getBoundingClientRect();


        const zoom =
            this.camera?.zoom ||
            1;


        return {

            x:
                rect.left +
                rect.width / 2 +
                (
                    worldX *
                    zoom
                ) +
                (
                    this.camera?.x ||
                    0
                ),

            y:
                rect.top +
                rect.height / 2 +
                (
                    worldY *
                    zoom
                ) +
                (
                    this.camera?.y ||
                    0
                )
        };
    }


    /* ========================================================
       DISTANCE
    ======================================================== */

    distance(
        x1,
        y1,
        x2,
        y2
    ) {

        return Math.hypot(
            x2 - x1,
            y2 - y1
        );
    }


    /* ========================================================
       CONTEXT MENU
    ======================================================== */

    setupContextMenu() {

        this.addListener(
            this.canvas,
            "contextmenu",
            event => {

                event.preventDefault();


                this.cancelTool();


                this.dispatch(
                    "metrocity:contextMenu",
                    {
                        x:
                            event.clientX,

                        y:
                            event.clientY
                    }
                );
            }
        );
    }


    /* ========================================================
       WINDOW EVENTS
    ======================================================== */

    setupWindowEvents() {

        this.addListener(
            window,
            "blur",
            () => {

                this.keys.clear();

                this.cancelLongPress();

                this.cameraDragging =
                    false;
            }
        );


        this.addListener(
            window,
            "resize",
            () => {

                this.cancelLongPress();

            },
            {
                passive: true
            }
        );
    }


    /* ========================================================
       EVENT HELPER
    ======================================================== */

    addListener(
        target,
        event,
        handler,
        options
    ) {

        if (!target) {
            return;
        }


        target.addEventListener(
            event,
            handler,
            options
        );


        this.listeners.push(
            {
                target,
                event,
                handler,
                options
            }
        );
    }


    /* ========================================================
       DISPATCH EVENT
    ======================================================== */

    dispatch(
        eventName,
        detail = {}
    ) {

        window.dispatchEvent(
            new CustomEvent(
                eventName,
                {
                    detail
                }
            )
        );
    }


    /* ========================================================
       ENABLE
    ======================================================== */

    enable() {

        this.enabled =
            true;


        this.dispatch(
            "metrocity:inputEnabled"
        );
    }


    /* ========================================================
       DISABLE
    ======================================================== */

    disable() {

        this.enabled =
            false;


        this.keys.clear();

        this.cancelLongPress();

        this.cameraDragging =
            false;


        this.dispatch(
            "metrocity:inputDisabled"
        );
    }


    /* ========================================================
       DESTROY
    ======================================================== */

    destroy() {

        if (
            this.destroyed
        ) {

            return;
        }


        this.destroyed =
            true;


        this.cancelLongPress();


        this.keys.clear();


        for (
            const listener
            of this.listeners
        ) {

            try {

                listener.target
                    .removeEventListener(
                        listener.event,
                        listener.handler,
                        listener.options
                    );

            } catch {
                /*
                 * Ignore cleanup errors.
                 */
            }
        }


        this.listeners =
            [];


        this.pointers.clear();


        this.primaryPointer =
            null;


        this.cameraDragging =
            false;
    }
}
