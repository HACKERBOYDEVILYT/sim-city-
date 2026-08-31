/* ============================================================
   METROCITY V5
   Camera Engine
   Professional 2D City-Builder Camera
============================================================ */

export class CameraEngine {

    /* ========================================================
       CONSTRUCTOR
    ======================================================== */

    constructor(
        canvas,
        options = {}
    ) {

        this.canvas =
            canvas;

        this.enabled =
            true;


        /* ----------------------------------------------------
           CAMERA STATE
        ---------------------------------------------------- */

        this.x =
            Number(
                options.x ?? 0
            );

        this.y =
            Number(
                options.y ?? 0
            );

        this.zoom =
            Number(
                options.zoom ?? 1
            );

        this.targetX =
            this.x;

        this.targetY =
            this.y;

        this.targetZoom =
            this.zoom;


        /* ----------------------------------------------------
           ZOOM LIMITS
        ---------------------------------------------------- */

        this.minZoom =
            Number(
                options.minZoom ?? 0.35
            );

        this.maxZoom =
            Number(
                options.maxZoom ?? 4
            );


        /* ----------------------------------------------------
           MOVEMENT
        ---------------------------------------------------- */

        this.panSpeed =
            Number(
                options.panSpeed ?? 1
            );

        this.zoomSpeed =
            Number(
                options.zoomSpeed ?? 1
            );


        this.smoothness =
            Number(
                options.smoothness ?? 0.16
            );


        /* ----------------------------------------------------
           WORLD LIMITS
        ---------------------------------------------------- */

        this.worldWidth =
            Number(
                options.worldWidth ?? 2400
            );

        this.worldHeight =
            Number(
                options.worldHeight ?? 2400
            );


        this.limitToWorld =
            options.limitToWorld !== false;


        /* ----------------------------------------------------
           INTERACTION STATE
        ---------------------------------------------------- */

        this.pointers =
            new Map();


        this.primaryPointer =
            null;


        this.isDragging =
            false;


        this.dragStart =
            null;


        this.lastPointer =
            null;


        this.dragDistance =
            0;


        this.wasDragged =
            false;


        /* ----------------------------------------------------
           PINCH ZOOM
        ---------------------------------------------------- */

        this.pinchActive =
            false;


        this.pinchStartDistance =
            0;


        this.pinchStartZoom =
            1;


        this.pinchCenter =
            null;


        this.pinchWorldPoint =
            null;


        /* ----------------------------------------------------
           MOUSE WHEEL
        ---------------------------------------------------- */

        this.wheelZoomEnabled =
            true;


        /* ----------------------------------------------------
           KEYBOARD
        ---------------------------------------------------- */

        this.keyboardEnabled =
            options.keyboard !== false;


        this.keys =
            new Set();


        this.keyboardSpeed =
            Number(
                options.keyboardSpeed ?? 8
            );


        /* ----------------------------------------------------
           BOUNDS
        ---------------------------------------------------- */

        this.padding =
            Number(
                options.padding ?? 150
            );


        /* ----------------------------------------------------
           EVENTS
        ---------------------------------------------------- */

        this.onChange =
            typeof options.onChange ===
            "function"
                ? options.onChange
                : null;


        this.onDragStart =
            typeof options.onDragStart ===
            "function"
                ? options.onDragStart
                : null;


        this.onDrag =
            typeof options.onDrag ===
            "function"
                ? options.onDrag
                : null;


        this.onDragEnd =
            typeof options.onDragEnd ===
            "function"
                ? options.onDragEnd
                : null;


        this.onZoom =
            typeof options.onZoom ===
            "function"
                ? options.onZoom
                : null;


        /* ----------------------------------------------------
           TOUCH SETTINGS
        ---------------------------------------------------- */

        this.canvas.style.touchAction =
            "none";


        this.attachEvents();


        this.updateCanvasCursor();

    }


    /* ========================================================
       EVENT BINDING
    ======================================================== */

    attachEvents() {

        if (!this.canvas)
            return;


        this.boundPointerDown =
            event =>
                this.handlePointerDown(
                    event
                );


        this.boundPointerMove =
            event =>
                this.handlePointerMove(
                    event
                );


        this.boundPointerUp =
            event =>
                this.handlePointerUp(
                    event
                );


        this.boundPointerCancel =
            event =>
                this.handlePointerCancel(
                    event
                );


        this.boundWheel =
            event =>
                this.handleWheel(
                    event
                );


        this.boundKeyDown =
            event =>
                this.handleKeyDown(
                    event
                );


        this.boundKeyUp =
            event =>
                this.handleKeyUp(
                    event
                );


        this.canvas.addEventListener(
            "pointerdown",
            this.boundPointerDown,
            {
                passive: false
            }
        );


        this.canvas.addEventListener(
            "pointermove",
            this.boundPointerMove,
            {
                passive: false
            }
        );


        this.canvas.addEventListener(
            "pointerup",
            this.boundPointerUp,
            {
                passive: false
            }
        );


        this.canvas.addEventListener(
            "pointercancel",
            this.boundPointerCancel,
            {
                passive: false
            }
        );


        this.canvas.addEventListener(
            "wheel",
            this.boundWheel,
            {
                passive: false
            }
        );


        if (
            this.keyboardEnabled
        ) {

            window.addEventListener(
                "keydown",
                this.boundKeyDown
            );


            window.addEventListener(
                "keyup",
                this.boundKeyUp
            );
        }

    }


    /* ========================================================
       DESTROY
    ======================================================== */

    destroy() {

        if (!this.canvas)
            return;


        this.canvas.removeEventListener(
            "pointerdown",
            this.boundPointerDown
        );


        this.canvas.removeEventListener(
            "pointermove",
            this.boundPointerMove
        );


        this.canvas.removeEventListener(
            "pointerup",
            this.boundPointerUp
        );


        this.canvas.removeEventListener(
            "pointercancel",
            this.boundPointerCancel
        );


        this.canvas.removeEventListener(
            "wheel",
            this.boundWheel
        );


        if (
            this.keyboardEnabled
        ) {

            window.removeEventListener(
                "keydown",
                this.boundKeyDown
            );


            window.removeEventListener(
                "keyup",
                this.boundKeyUp
            );
        }


        this.pointers.clear();

    }


    /* ========================================================
       POINTER DOWN
    ======================================================== */

    handlePointerDown(
        event
    ) {

        if (!this.enabled)
            return;


        /*
         * Ignore non-primary mouse buttons.
         */

        if (
            event.pointerType ===
            "mouse" &&
            event.button !== 0
        ) {

            return;
        }


        event.preventDefault();


        const point =
            this.getPointerPosition(
                event
            );


        this.pointers.set(
            event.pointerId,
            point
        );


        /*
         * Two fingers = pinch.
         */

        if (
            this.pointers.size >= 2
        ) {

            this.beginPinch();

            return;
        }


        this.primaryPointer =
            event.pointerId;


        this.isDragging =
            false;


        this.wasDragged =
            false;


        this.dragDistance =
            0;


        this.dragStart = {

            x:
                point.x,

            y:
                point.y,

            cameraX:
                this.targetX,

            cameraY:
                this.targetY
        };


        this.lastPointer = {

            x:
                point.x,

            y:
                point.y
        };


        this.updateCanvasCursor();

    }


    /* ========================================================
       POINTER MOVE
    ======================================================== */

    handlePointerMove(
        event
    ) {

        if (!this.enabled)
            return;


        if (
            !this.pointers.has(
                event.pointerId
            )
        ) {

            return;
        }


        event.preventDefault();


        const point =
            this.getPointerPosition(
                event
            );


        this.pointers.set(
            event.pointerId,
            point
        );


        /*
         * Pinch.
         */

        if (
            this.pointers.size >= 2
        ) {

            if (
                !this.pinchActive
            ) {

                this.beginPinch();
            }


            this.updatePinch();

            return;
        }


        /*
         * Only primary pointer drags.
         */

        if (
            event.pointerId !==
            this.primaryPointer
        ) {

            return;
        }


        if (
            !this.dragStart
        ) {

            return;
        }


        const dx =
            point.x -
            this.dragStart.x;


        const dy =
            point.y -
            this.dragStart.y;


        this.dragDistance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        /*
         * Small movement is treated as click.
         */

        if (
            !this.isDragging &&
            this.dragDistance < 5
        ) {

            return;
        }


        if (
            !this.isDragging
        ) {

            this.isDragging =
                true;


            this.wasDragged =
                true;


            if (
                this.onDragStart
            ) {

                this.onDragStart(
                    this.getState()
                );
            }


            this.updateCanvasCursor();

        }


        /*
         * Move camera.
         */

        const movementScale =
            1 /
            Math.max(
                this.zoom,
                0.01
            );


        this.targetX =
            this.dragStart.cameraX +
            dx *
            this.panSpeed *
            movementScale;


        this.targetY =
            this.dragStart.cameraY +
            dy *
            this.panSpeed *
            movementScale;


        this.clampTarget();


        if (
            this.onDrag
        ) {

            this.onDrag(
                this.getState()
            );
        }

    }


    /* ========================================================
       POINTER UP
    ======================================================== */

    handlePointerUp(
        event
    ) {

        if (
            this.pointers.has(
                event.pointerId
            )
        ) {

            this.pointers.delete(
                event.pointerId
            );
        }


        /*
         * Finish pinch.
         */

        if (
            this.pinchActive &&
            this.pointers.size < 2
        ) {

            this.endPinch();
        }


        if (
            event.pointerId !==
            this.primaryPointer
        ) {

            return;
        }


        this.primaryPointer =
            null;


        if (
            this.isDragging
        ) {

            this.isDragging =
                false;


            if (
                this.onDragEnd
            ) {

                this.onDragEnd(
                    this.getState()
                );
            }
        }


        this.dragStart =
            null;


        this.lastPointer =
            null;


        this.updateCanvasCursor();

    }


    /* ========================================================
       POINTER CANCEL
    ======================================================== */

    handlePointerCancel(
        event
    ) {

        this.pointers.delete(
            event.pointerId
        );


        if (
            this.pinchActive &&
            this.pointers.size < 2
        ) {

            this.endPinch();
        }


        if (
            event.pointerId ===
            this.primaryPointer
        ) {

            this.primaryPointer =
                null;

            this.dragStart =
                null;

            this.lastPointer =
                null;

            this.isDragging =
                false;
        }


        this.updateCanvasCursor();

    }


    /* ========================================================
       PINCH START
    ======================================================== */

    beginPinch() {

        if (
            this.pointers.size < 2
        ) {

            return;
        }


        const points =
            Array.from(
                this.pointers.values()
            );


        const a =
            points[0];


        const b =
            points[1];


        this.pinchStartDistance =
            this.distance(
                a,
                b
            );


        if (
            this.pinchStartDistance <= 0
        ) {

            return;
        }


        this.pinchStartZoom =
            this.targetZoom;


        this.pinchCenter =
            this.getCenter(
                a,
                b
            );


        this.pinchWorldPoint =
            this.screenToWorld(
                this.pinchCenter.x,
                this.pinchCenter.y
            );


        this.pinchActive =
            true;


        this.isDragging =
            false;


        this.dragStart =
            null;

    }


    /* ========================================================
       PINCH UPDATE
    ======================================================== */

    updatePinch() {

        if (
            !this.pinchActive ||
            this.pointers.size < 2
        ) {

            return;
        }


        const points =
            Array.from(
                this.pointers.values()
            );


        const a =
            points[0];


        const b =
            points[1];


        const distance =
            this.distance(
                a,
                b
            );


        if (
            distance <= 0 ||
            this.pinchStartDistance <= 0
        ) {

            return;
        }


        const ratio =
            distance /
            this.pinchStartDistance;


        const nextZoom =
            this.pinchStartZoom *
            ratio;


        this.setZoom(
            nextZoom,
            this.pinchCenter
        );

    }


    /* ========================================================
       PINCH END
    ======================================================== */

    endPinch() {

        this.pinchActive =
            false;


        this.pinchStartDistance =
            0;


        this.pinchWorldPoint =
            null;


        this.pinchCenter =
            null;

    }


    /* ========================================================
       WHEEL ZOOM
    ======================================================== */

    handleWheel(
        event
    ) {

        if (
            !this.enabled ||
            !this.wheelZoomEnabled
        ) {

            return;
        }


        event.preventDefault();


        const point =
            this.getPointerPosition(
                event
            );


        /*
         * Positive delta = zoom out.
         * Negative delta = zoom in.
         */

        const direction =
            event.deltaY < 0
                ? 1
                : -1;


        const factor =
            direction > 0
                ? 1.12
                : 1 / 1.12;


        this.setZoom(
            this.targetZoom *
            factor,
            point
        );

    }


    /* ========================================================
       SET ZOOM
    ======================================================== */

    setZoom(
        value,
        screenPoint = null
    ) {

        const oldZoom =
            this.targetZoom;


        const newZoom =
            this.clamp(
                value,
                this.minZoom,
                this.maxZoom
            );


        if (
            Math.abs(
                newZoom -
                oldZoom
            ) <
            0.00001
        ) {

            return;
        }


        /*
         * Zoom around cursor / pinch center.
         */

        if (
            screenPoint
        ) {

            const worldPoint =
                this.screenToWorld(
                    screenPoint.x,
                    screenPoint.y,
                    oldZoom
                );


            this.targetZoom =
                newZoom;


            const afterZoom =
                this.worldToScreen(
                    worldPoint.x,
                    worldPoint.y,
                    newZoom
                );


            const dx =
                screenPoint.x -
                afterZoom.x;


            const dy =
                screenPoint.y -
                afterZoom.y;


            this.targetX +=
                dx;


            this.targetY +=
                dy;

        } else {

            this.targetZoom =
                newZoom;
        }


        this.clampTarget();


        if (
            this.onZoom
        ) {

            this.onZoom(
                newZoom,
                this.getState()
            );
        }

    }


    /* ========================================================
       ZOOM IN
    ======================================================== */

    zoomIn(
        amount = 1.25,
        screenPoint = null
    ) {

        this.setZoom(
            this.targetZoom *
            amount,
            screenPoint
        );

    }


    /* ========================================================
       ZOOM OUT
    ======================================================== */

    zoomOut(
        amount = 1.25,
        screenPoint = null
    ) {

        this.setZoom(
            this.targetZoom /
            amount,
            screenPoint
        );

    }


    /* ========================================================
       RESET
    ======================================================== */

    reset(
        animated = true
    ) {

        if (animated) {

            this.targetX =
                0;

            this.targetY =
                0;

            this.targetZoom =
                1;

        } else {

            this.x =
                0;

            this.y =
                0;

            this.zoom =
                1;

            this.targetX =
                0;

            this.targetY =
                0;

            this.targetZoom =
                1;
        }


        this.clampTarget();

    }


    /* ========================================================
       MOVE TO
    ======================================================== */

    moveTo(
        x,
        y,
        animated = true
    ) {

        x =
            Number(x) || 0;


        y =
            Number(y) || 0;


        if (animated) {

            this.targetX =
                x;

            this.targetY =
                y;

        } else {

            this.x =
                x;

            this.y =
                y;

            this.targetX =
                x;

            this.targetY =
                y;
        }


        this.clampTarget();

    }


    /* ========================================================
       FOCUS WORLD POINT
    ======================================================== */

    focus(
        worldX,
        worldY,
        zoom = null
    ) {

        const canvasCenter =
            this.getCanvasCenter();


        const desiredZoom =
            zoom === null
                ? this.targetZoom
                : this.clamp(
                    zoom,
                    this.minZoom,
                    this.maxZoom
                );


        this.targetZoom =
            desiredZoom;


        this.targetX =
            canvasCenter.x -
            worldX *
            desiredZoom -
            canvasCenter.x;


        this.targetY =
            canvasCenter.y -
            worldY *
            desiredZoom -
            canvasCenter.y;


        /*
         * Camera coordinates represent
         * screen-space translation.
         */

        this.targetX =
            -worldX *
            desiredZoom;


        this.targetY =
            -worldY *
            desiredZoom;


        this.clampTarget();

    }


    /* ========================================================
       UPDATE
    ======================================================== */

    update(
        delta = 16
    ) {

        if (!this.enabled)
            return;


        const dt =
            Math.min(
                Number(delta) || 16,
                100
            );


        /*
         * Keyboard movement.
         */

        this.updateKeyboard(
            dt
        );


        /*
         * Smooth camera.
         */

        const smoothing =
            1 -
            Math.pow(
                1 -
                this.smoothness,
                dt / 16.6667
            );


        this.x +=
            (
                this.targetX -
                this.x
            ) *
            smoothing;


        this.y +=
            (
                this.targetY -
                this.y
            ) *
            smoothing;


        this.zoom +=
            (
                this.targetZoom -
                this.zoom
            ) *
            smoothing;


        /*
         * Snap tiny differences.
         */

        if (
            Math.abs(
                this.targetX -
                this.x
            ) < 0.001
        ) {

            this.x =
                this.targetX;
        }


        if (
            Math.abs(
                this.targetY -
                this.y
            ) < 0.001
        ) {

            this.y =
                this.targetY;
        }


        if (
            Math.abs(
                this.targetZoom -
                this.zoom
            ) < 0.0001
        ) {

            this.zoom =
                this.targetZoom;
        }


        this.clampCurrent();


        if (
            this.onChange
        ) {

            this.onChange(
                this.getState()
            );
        }

    }


    /* ========================================================
       KEYBOARD
    ======================================================== */

    handleKeyDown(
        event
    ) {

        if (!this.keyboardEnabled)
            return;


        const key =
            event.key.toLowerCase();


        const allowed = [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            "w",
            "a",
            "s",
            "d",
            "+",
            "=",
            "-",
            "_"
        ];


        if (
            allowed.includes(
                key
            )
        ) {

            this.keys.add(
                key
            );


            /*
             * Don't hijack typing.
             */

            const target =
                event.target;


            if (
                target &&
                (
                    target.tagName ===
                        "INPUT" ||
                    target.tagName ===
                        "TEXTAREA" ||
                    target.isContentEditable
                )
            ) {

                return;
            }


            event.preventDefault();
        }

    }


    handleKeyUp(
        event
    ) {

        this.keys.delete(
            event.key.toLowerCase()
        );

    }


    updateKeyboard(
        delta
    ) {

        if (
            !this.keyboardEnabled ||
            this.keys.size === 0
        ) {

            return;
        }


        const distance =
            this.keyboardSpeed *
            (delta / 16.6667) /
            Math.max(
                this.zoom,
                0.01
            );


        let dx =
            0;


        let dy =
            0;


        if (
            this.keys.has("arrowleft") ||
            this.keys.has("a")
        ) {

            dx +=
                distance;
        }


        if (
            this.keys.has("arrowright") ||
            this.keys.has("d")
        ) {

            dx -=
                distance;
        }


        if (
            this.keys.has("arrowup") ||
            this.keys.has("w")
        ) {

            dy +=
                distance;
        }


        if (
            this.keys.has("arrowdown") ||
            this.keys.has("s")
        ) {

            dy -=
                distance;
        }


        if (dx || dy) {

            this.targetX +=
                dx;

            this.targetY +=
                dy;


            this.clampTarget();
        }


        if (
            this.keys.has("+") ||
            this.keys.has("=")
        ) {

            this.setZoom(
                this.targetZoom *
                1.02
            );
        }


        if (
            this.keys.has("-") ||
            this.keys.has("_")
        ) {

            this.setZoom(
                this.targetZoom /
                1.02
            );
        }

    }


    /* ========================================================
       SCREEN → WORLD
    ======================================================== */

    screenToWorld(
        screenX,
        screenY,
        zoom = this.zoom
    ) {

        const center =
            this.getCanvasCenter();


        const safeZoom =
            Math.max(
                zoom,
                0.0001
            );


        return {

            x:
                (
                    screenX -
                    center.x -
                    this.x
                ) /
                safeZoom,

            y:
                (
                    screenY -
                    center.y -
                    this.y
                ) /
                safeZoom
        };

    }


    /* ========================================================
       WORLD → SCREEN
    ======================================================== */

    worldToScreen(
        worldX,
        worldY,
        zoom = this.zoom
    ) {

        const center =
            this.getCanvasCenter();


        return {

            x:
                center.x +
                this.x +
                worldX *
                zoom,

            y:
                center.y +
                this.y +
                worldY *
                zoom
        };

    }


    /* ========================================================
       GET POINTER
    ======================================================== */

    getPointerPosition(
        event
    ) {

        const rect =
            this.canvas
                .getBoundingClientRect();


        return {

            x:
                event.clientX -
                rect.left,

            y:
                event.clientY -
                rect.top
        };

    }


    /* ========================================================
       CANVAS CENTER
    ======================================================== */

    getCanvasCenter() {

        return {

            x:
                this.canvas
                    .clientWidth /
                2,

            y:
                this.canvas
                    .clientHeight /
                2
        };

    }


    /* ========================================================
       WORLD BOUNDS
    ======================================================== */

    clampTarget() {

        if (
            !this.limitToWorld
        ) {

            return;
        }


        const width =
            this.canvas.clientWidth;


        const height =
            this.canvas.clientHeight;


        const halfWorldWidth =
            this.worldWidth *
            this.targetZoom /
            2;


        const halfWorldHeight =
            this.worldHeight *
            this.targetZoom /
            2;


        /*
         * Don't allow the camera to move
         * infinitely away from the city.
         */

        const maxX =
            Math.max(
                this.padding,
                halfWorldWidth +
                width / 2
            );


        const maxY =
            Math.max(
                this.padding,
                halfWorldHeight +
                height / 2
            );


        this.targetX =
            this.clamp(
                this.targetX,
                -maxX,
                maxX
            );


        this.targetY =
            this.clamp(
                this.targetY,
                -maxY,
                maxY
            );

    }


    /* ========================================================
       CURRENT BOUNDS
    ======================================================== */

    clampCurrent() {

        if (
            !this.limitToWorld
        ) {

            return;
        }


        const width =
            this.canvas.clientWidth;


        const height =
            this.canvas.clientHeight;


        const halfWorldWidth =
            this.worldWidth *
            this.zoom /
            2;


        const halfWorldHeight =
            this.worldHeight *
            this.zoom /
            2;


        const maxX =
            Math.max(
                this.padding,
                halfWorldWidth +
                width / 2
            );


        const maxY =
            Math.max(
                this.padding,
                halfWorldHeight +
                height / 2
            );


        this.x =
            this.clamp(
                this.x,
                -maxX,
                maxX
            );


        this.y =
            this.clamp(
                this.y,
                -maxY,
                maxY
            );

    }


    /* ========================================================
       WORLD SIZE
    ======================================================== */

    setWorldSize(
        width,
        height = width
    ) {

        this.worldWidth =
            Math.max(
                1,
                Number(width) || 1
            );


        this.worldHeight =
            Math.max(
                1,
                Number(height) || 1
            );


        this.clampTarget();

    }


    /* ========================================================
       ENABLE / DISABLE
    ======================================================== */

    setEnabled(
        enabled
    ) {

        this.enabled =
            Boolean(
                enabled
            );


        if (
            !this.enabled
        ) {

            this.pointers.clear();

            this.isDragging =
                false;

            this.pinchActive =
                false;
        }


        this.updateCanvasCursor();

    }


    /* ========================================================
       CURSOR
    ======================================================== */

    updateCanvasCursor() {

        if (!this.canvas)
            return;


        if (!this.enabled) {

            this.canvas.style.cursor =
                "default";

            return;
        }


        if (
            this.isDragging
        ) {

            this.canvas.style.cursor =
                "grabbing";

        } else {

            this.canvas.style.cursor =
                "grab";
        }

    }


    /* ========================================================
       STATE
    ======================================================== */

    getState() {

        return {

            x:
                this.x,

            y:
                this.y,

            zoom:
                this.zoom,

            targetX:
                this.targetX,

            targetY:
                this.targetY,

            targetZoom:
                this.targetZoom,

            minZoom:
                this.minZoom,

            maxZoom:
                this.maxZoom,

            isDragging:
                this.isDragging,

            pinchActive:
                this.pinchActive
        };

    }


    /* ========================================================
       SET STATE
    ======================================================== */

    setState(
        state = {},
        instant = false
    ) {

        const x =
            Number(
                state.x ?? 0
            );


        const y =
            Number(
                state.y ?? 0
            );


        const zoom =
            this.clamp(
                Number(
                    state.zoom ?? 1
                ),
                this.minZoom,
                this.maxZoom
            );


        if (instant) {

            this.x =
                x;

            this.y =
                y;

            this.zoom =
                zoom;
        }


        this.targetX =
            x;

        this.targetY =
            y;

        this.targetZoom =
            zoom;


        this.clampTarget();

    }


    /* ========================================================
       SCREEN SIZE CHANGE
    ======================================================== */

    resize() {

        this.clampTarget();

        this.clampCurrent();

    }


    /* ========================================================
       HELPERS
    ======================================================== */

    distance(
        a,
        b
    ) {

        const dx =
            b.x -
            a.x;


        const dy =
            b.y -
            a.y;


        return Math.sqrt(
            dx * dx +
            dy * dy
        );

    }


    getCenter(
        a,
        b
    ) {

        return {

            x:
                (
                    a.x +
                    b.x
                ) /
                2,

            y:
                (
                    a.y +
                    b.y
                ) /
                2
        };

    }


    clamp(
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

}


/* ============================================================
   DEFAULT CAMERA FACTORY
============================================================ */

export function createCamera(
    canvas,
    options = {}
) {

    return new CameraEngine(
        canvas,
        {
            minZoom:
                0.35,

            maxZoom:
                4,

            zoom:
                1,

            panSpeed:
                1,

            zoomSpeed:
                1,

            smoothness:
                0.16,

            worldWidth:
                2400,

            worldHeight:
                2400,

            limitToWorld:
                true,

            keyboard:
                true,

            ...options
        }
    );

}
