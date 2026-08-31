/* ============================================================
   MetroCity V5 — CameraEngine
   Desktop + Mobile camera controls
   Pan • Zoom • Touch • Pinch • Smooth movement
============================================================ */

export class CameraEngine {

    constructor(canvas, options = {}) {

        this.canvas = canvas;

        this.x = Number(options.x || 0);
        this.y = Number(options.y || 0);

        this.zoom = Number(options.zoom || 1);

        this.minZoom = Number(
            options.minZoom || 0.35
        );

        this.maxZoom = Number(
            options.maxZoom || 2.8
        );

        this.zoomSpeed = Number(
            options.zoomSpeed || 0.0015
        );

        this.panSpeed = Number(
            options.panSpeed || 1
        );

        this.smoothing = Number(
            options.smoothing || 0.18
        );

        this.targetX = this.x;
        this.targetY = this.y;

        this.targetZoom = this.zoom;

        this.isDragging = false;

        this.dragPointerId = null;

        this.lastPointerX = 0;
        this.lastPointerY = 0;

        this.pointers = new Map();

        this.lastPinchDistance = null;

        this.lastPinchCenter = null;

        this.velocityX = 0;
        this.velocityY = 0;

        this.worldWidth =
            options.worldWidth || 5000;

        this.worldHeight =
            options.worldHeight || 5000;

        this.enableBounds =
            options.enableBounds !== false;

        this.bindEvents();

        this.animate();
    }


    /* ========================================================
       EVENT SETUP
    ======================================================== */

    bindEvents() {

        this.canvas.style.touchAction =
            "none";

        this.canvas.addEventListener(
            "pointerdown",
            event =>
                this.pointerDown(event)
        );

        this.canvas.addEventListener(
            "pointermove",
            event =>
                this.pointerMove(event)
        );

        this.canvas.addEventListener(
            "pointerup",
            event =>
                this.pointerUp(event)
        );

        this.canvas.addEventListener(
            "pointercancel",
            event =>
                this.pointerUp(event)
        );

        this.canvas.addEventListener(
            "wheel",
            event =>
                this.wheel(event),
            {
                passive: false
            }
        );

        /*
         * Double click / double tap
         */

        this.canvas.addEventListener(
            "dblclick",
            event => {

                const point =
                    this.screenToWorld(
                        event.clientX,
                        event.clientY
                    );

                this.zoomAt(
                    point.x,
                    point.y,
                    1.25
                );
            }
        );
    }


    /* ========================================================
       POINTER DOWN
    ======================================================== */

    pointerDown(event) {

        this.pointers.set(
            event.pointerId,
            {
                x: event.clientX,
                y: event.clientY
            }
        );


        /*
         * Two fingers = pinch zoom
         */

        if (
            this.pointers.size >= 2
        ) {

            this.isDragging = false;

            this.setupPinch();

            return;
        }


        /*
         * Left mouse / primary touch
         */

        if (
            event.button !== 0 &&
            event.pointerType === "mouse"
        ) {

            return;
        }


        this.isDragging = true;

        this.dragPointerId =
            event.pointerId;

        this.lastPointerX =
            event.clientX;

        this.lastPointerY =
            event.clientY;

        this.velocityX = 0;
        this.velocityY = 0;

        try {

            this.canvas.setPointerCapture(
                event.pointerId
            );

        } catch (_) {}
    }


    /* ========================================================
       POINTER MOVE
    ======================================================== */

    pointerMove(event) {

        if (
            this.pointers.has(
                event.pointerId
            )
        ) {

            this.pointers.set(
                event.pointerId,
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
        }


        /*
         * Pinch
         */

        if (
            this.pointers.size >= 2
        ) {

            this.handlePinch();

            return;
        }


        /*
         * Normal pan
         */

        if (
            !this.isDragging
        ) {

            return;
        }


        if (
            this.dragPointerId !==
            event.pointerId
        ) {

            return;
        }


        const dx =
            event.clientX -
            this.lastPointerX;


        const dy =
            event.clientY -
            this.lastPointerY;


        this.lastPointerX =
            event.clientX;

        this.lastPointerY =
            event.clientY;


        this.targetX +=
            dx *
            this.panSpeed;


        this.targetY +=
            dy *
            this.panSpeed;


        this.velocityX =
            dx *
            this.panSpeed;

        this.velocityY =
            dy *
            this.panSpeed;


        this.clampTarget();
    }


    /* ========================================================
       POINTER UP
    ======================================================== */

    pointerUp(event) {

        this.pointers.delete(
            event.pointerId
        );


        if (
            this.pointers.size < 2
        ) {

            this.lastPinchDistance =
                null;

            this.lastPinchCenter =
                null;
        }


        if (
            this.dragPointerId ===
            event.pointerId
        ) {

            this.isDragging = false;

            this.dragPointerId = null;
        }
    }


    /* ========================================================
       PINCH SETUP
    ======================================================== */

    setupPinch() {

        const points =
            [...this.pointers.values()];


        if (
            points.length < 2
        ) {

            return;
        }


        this.lastPinchDistance =
            this.getPointerDistance(
                points[0],
                points[1]
            );


        this.lastPinchCenter =
            this.getPointerCenter(
                points[0],
                points[1]
            );
    }


    /* ========================================================
       PINCH HANDLER
    ======================================================== */

    handlePinch() {

        const points =
            [...this.pointers.values()];


        if (
            points.length < 2
        ) {

            return;
        }


        const distance =
            this.getPointerDistance(
                points[0],
                points[1]
            );


        const center =
            this.getPointerCenter(
                points[0],
                points[1]
            );


        if (
            !this.lastPinchDistance
        ) {

            this.lastPinchDistance =
                distance;

            this.lastPinchCenter =
                center;

            return;
        }


        /*
         * Move camera with pinch center.
         */

        if (
            this.lastPinchCenter
        ) {

            const dx =
                center.x -
                this.lastPinchCenter.x;


            const dy =
                center.y -
                this.lastPinchCenter.y;


            this.targetX += dx;

            this.targetY += dy;
        }


        /*
         * Zoom.
         */

        const ratio =
            distance /
            this.lastPinchDistance;


        if (
            Number.isFinite(ratio) &&
            ratio > 0
        ) {

            const worldPoint =
                this.screenToWorld(
                    center.x,
                    center.y
                );


            this.setZoomAt(
                worldPoint.x,
                worldPoint.y,
                this.zoom * ratio
            );
        }


        this.lastPinchDistance =
            distance;

        this.lastPinchCenter =
            center;


        this.clampTarget();
    }


    /* ========================================================
       WHEEL ZOOM
    ======================================================== */

    wheel(event) {

        event.preventDefault();


        const worldPoint =
            this.screenToWorld(
                event.clientX,
                event.clientY
            );


        const factor =
            Math.exp(
                -event.deltaY *
                this.zoomSpeed
            );


        this.setZoomAt(
            worldPoint.x,
            worldPoint.y,
            this.targetZoom *
            factor
        );
    }


    /* ========================================================
       SET ZOOM
    ======================================================== */

    setZoom(
        zoom
    ) {

        this.targetZoom =
            this.clamp(
                zoom,
                this.minZoom,
                this.maxZoom
            );

        this.clampTarget();
    }


    /* ========================================================
       ZOOM AT WORLD POSITION
    ======================================================== */

    setZoomAt(
        worldX,
        worldY,
        zoom
    ) {

        const newZoom =
            this.clamp(
                zoom,
                this.minZoom,
                this.maxZoom
            );


        const oldZoom =
            this.targetZoom;


        if (
            Math.abs(
                newZoom -
                oldZoom
            ) < 0.00001
        ) {

            return;
        }


        /*
         * Keep the cursor/pinch point
         * fixed while zooming.
         */

        this.targetX =
            worldX -
            (
                worldX -
                this.targetX
            ) *
            (
                oldZoom /
                newZoom
            );


        this.targetY =
            worldY -
            (
                worldY -
                this.targetY
            ) *
            (
                oldZoom /
                newZoom
            );


        this.targetZoom =
            newZoom;


        this.clampTarget();
    }


    /* ========================================================
       QUICK ZOOM
    ======================================================== */

    zoomAt(
        worldX,
        worldY,
        multiplier
    ) {

        this.setZoomAt(
            worldX,
            worldY,
            this.targetZoom *
            multiplier
        );
    }


    /* ========================================================
       RESET CAMERA
    ======================================================== */

    reset(
        x = 0,
        y = 0,
        zoom = 1
    ) {

        this.targetX = x;
        this.targetY = y;

        this.targetZoom =
            this.clamp(
                zoom,
                this.minZoom,
                this.maxZoom
            );
    }


    /* ========================================================
       CENTER CAMERA
    ======================================================== */

    centerOn(
        worldX,
        worldY
    ) {

        this.targetX =
            -worldX *
            this.targetZoom;


        this.targetY =
            -worldY *
            this.targetZoom;


        this.clampTarget();
    }


    /* ========================================================
       SMOOTH CAMERA LOOP
    ======================================================== */

    animate() {

        this.x +=
            (
                this.targetX -
                this.x
            ) *
            this.smoothing;


        this.y +=
            (
                this.targetY -
                this.y
            ) *
            this.smoothing;


        this.zoom +=
            (
                this.targetZoom -
                this.zoom
            ) *
            this.smoothing;


        /*
         * Small inertial movement after
         * dragging.
         */

        if (
            !this.isDragging &&
            this.pointers.size === 0
        ) {

            if (
                Math.abs(
                    this.velocityX
                ) > 0.05 ||
                Math.abs(
                    this.velocityY
                ) > 0.05
            ) {

                this.targetX +=
                    this.velocityX *
                    0.08;

                this.targetY +=
                    this.velocityY *
                    0.08;


                this.velocityX *=
                    0.88;

                this.velocityY *=
                    0.88;


                this.clampTarget();
            }
        }


        requestAnimationFrame(
            () =>
                this.animate()
        );
    }


    /* ========================================================
       APPLY CAMERA TRANSFORM
    ======================================================== */

    apply(
        ctx
    ) {

        const width =
            this.canvas.width;


        const height =
            this.canvas.height;


        ctx.translate(
            width / 2 +
            this.x,

            height / 2 +
            this.y
        );


        ctx.scale(
            this.zoom,
            this.zoom
        );
    }


    /* ========================================================
       SCREEN → WORLD
    ======================================================== */

    screenToWorld(
        screenX,
        screenY
    ) {

        const rect =
            this.canvas.getBoundingClientRect();


        const localX =
            screenX -
            rect.left -
            rect.width / 2;


        const localY =
            screenY -
            rect.top -
            rect.height / 2;


        return {

            x:
                (
                    localX -
                    this.x
                ) /
                this.zoom,

            y:
                (
                    localY -
                    this.y
                ) /
                this.zoom

        };
    }


    /* ========================================================
       WORLD → SCREEN
    ======================================================== */

    worldToScreen(
        worldX,
        worldY
    ) {

        const rect =
            this.canvas.getBoundingClientRect();


        return {

            x:
                rect.left +
                rect.width / 2 +
                this.x +
                worldX *
                this.zoom,

            y:
                rect.top +
                rect.height / 2 +
                this.y +
                worldY *
                this.zoom

        };
    }


    /* ========================================================
       BOUNDS
    ======================================================== */

    clampTarget() {

        if (
            !this.enableBounds
        ) {

            return;
        }


        const rect =
            this.canvas.getBoundingClientRect();


        const viewWidth =
            rect.width /
            this.targetZoom;


        const viewHeight =
            rect.height /
            this.targetZoom;


        /*
         * Keep the playable world
         * roughly inside the camera.
         */

        const maxX =
            this.worldWidth / 2;


        const maxY =
            this.worldHeight / 2;


        const limitX =
            Math.max(
                0,
                maxX -
                viewWidth * 0.35
            );


        const limitY =
            Math.max(
                0,
                maxY -
                viewHeight * 0.35
            );


        this.targetX =
            this.clamp(
                this.targetX,
                -limitX,
                limitX
            );


        this.targetY =
            this.clamp(
                this.targetY,
                -limitY,
                limitY
            );
    }


    /* ========================================================
       RESIZE
    ======================================================== */

    resize() {

        this.clampTarget();
    }


    /* ========================================================
       HELPERS
    ======================================================== */

    getPointerDistance(
        a,
        b
    ) {

        return Math.hypot(
            b.x - a.x,
            b.y - a.y
        );
    }


    getPointerCenter(
        a,
        b
    ) {

        return {

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


    /* ========================================================
       DESTROY
    ======================================================== */

    destroy() {

        this.pointers.clear();

        this.isDragging =
            false;

        this.dragPointerId =
            null;
    }

}
