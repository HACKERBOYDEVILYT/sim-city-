/* ============================================================
   MetroCity V5
   RoadEngine
   Professional Road Construction System
   Compatible with:
   - main.js
   - existing index.html
   - camera { x, y, zoom }
   - city.roads
   - city.intersections
============================================================ */

export class RoadEngine {

    constructor(canvas, city, camera) {

        this.canvas = canvas;
        this.city = city;
        this.camera = camera;

        /* ====================================================
           CONFIG
        ==================================================== */

        this.roadWidth = 28;

        this.roadCostPerUnit = 20;

        this.snapDistance = 24;

        this.gridSize = 10;

        this.minimumRoadLength = 20;

        this.intersectionTolerance = 10;

        this.roadHitTolerance = 16;

        this.enabled = true;

        this.currentTool = null;

        /* ====================================================
           DRAW STATE
        ==================================================== */

        this.isDrawing = false;

        this.startPoint = null;

        this.currentPoint = null;

        this.pointerId = null;

        this.tempRoad = null;

        this.lastPointer = null;

        this.hasMoved = false;

        /* ====================================================
           EVENTS
        ==================================================== */

        this.boundPointerDown =
            event => this.pointerDown(event);

        this.boundPointerMove =
            event => this.pointerMove(event);

        this.boundPointerUp =
            event => this.pointerUp(event);

        this.boundPointerCancel =
            event => this.cancelDrawing(event);

        this.canvas.addEventListener(
            "pointerdown",
            this.boundPointerDown,
            { passive: false }
        );

        this.canvas.addEventListener(
            "pointermove",
            this.boundPointerMove,
            { passive: false }
        );

        this.canvas.addEventListener(
            "pointerup",
            this.boundPointerUp,
            { passive: false }
        );

        this.canvas.addEventListener(
            "pointercancel",
            this.boundPointerCancel,
            { passive: false }
        );

        this.canvas.style.touchAction = "none";
    }


    /* ========================================================
       TOOL CONTROL
    ======================================================== */

    setTool(tool) {

        this.currentTool = tool;

        /*
         * Keep compatibility with main.js.
         */
        if (this.city) {
            this.city.currentTool = tool;
        }

        if (tool !== "road") {
            this.resetDrawing();
            this.hideIndicator();
        }

        this.updateCursor();
    }


    enable() {

        this.enabled = true;

        this.updateCursor();
    }


    disable() {

        this.enabled = false;

        this.resetDrawing();

        this.hideIndicator();

        this.updateCursor();
    }


    updateCursor() {

        if (!this.canvas)
            return;

        if (!this.enabled) {

            this.canvas.style.cursor =
                "default";

            return;
        }

        if (this.currentTool === "road") {

            this.canvas.style.cursor =
                this.isDrawing
                    ? "crosshair"
                    : "crosshair";

        } else {

            this.canvas.style.cursor =
                "default";
        }
    }


    /* ========================================================
       POINTER DOWN
    ======================================================== */

    pointerDown(event) {

        if (!this.enabled)
            return;

        /*
         * Road tool must be active.
         */
        if (
            this.currentTool !== "road" &&
            this.city.currentTool !== "road"
        ) {
            return;
        }

        /*
         * Ignore right mouse button.
         */
        if (
            event.pointerType === "mouse" &&
            event.button !== 0
        ) {
            return;
        }

        event.preventDefault();

        const point =
            this.screenToWorld(
                event.clientX,
                event.clientY
            );

        const snapped =
            this.snapPoint(point);

        this.isDrawing = true;

        this.pointerId =
            event.pointerId;

        this.startPoint = {
            x: snapped.x,
            y: snapped.y
        };

        this.currentPoint = {
            x: snapped.x,
            y: snapped.y
        };

        this.lastPointer = {
            x: event.clientX,
            y: event.clientY
        };

        this.hasMoved = false;

        this.tempRoad = {

            x1: snapped.x,
            y1: snapped.y,

            x2: snapped.x,
            y2: snapped.y
        };

        try {

            this.canvas.setPointerCapture(
                event.pointerId
            );

        } catch (_) {}

        this.showIndicator(
            "Road • drag to build"
        );

        this.updateCursor();
    }


    /* ========================================================
       POINTER MOVE
    ======================================================== */

    pointerMove(event) {

        if (!this.isDrawing)
            return;

        if (
            event.pointerId !==
            this.pointerId
        ) {
            return;
        }

        event.preventDefault();

        const point =
            this.screenToWorld(
                event.clientX,
                event.clientY
            );

        const snapped =
            this.snapPoint(point);

        this.currentPoint = {
            x: snapped.x,
            y: snapped.y
        };

        this.tempRoad.x2 =
            snapped.x;

        this.tempRoad.y2 =
            snapped.y;

        if (this.lastPointer) {

            const dx =
                event.clientX -
                this.lastPointer.x;

            const dy =
                event.clientY -
                this.lastPointer.y;

            if (
                Math.abs(dx) > 2 ||
                Math.abs(dy) > 2
            ) {

                this.hasMoved = true;
            }
        }

        this.lastPointer = {

            x:
                event.clientX,

            y:
                event.clientY
        };

        this.updatePreviewIndicator();
    }


    /* ========================================================
       POINTER UP
    ======================================================== */

    pointerUp(event) {

        if (!this.isDrawing)
            return;

        if (
            event.pointerId !==
            this.pointerId
        ) {
            return;
        }

        event.preventDefault();

        const endPoint =
            this.snapPoint(
                this.currentPoint
            );

        const distance =
            this.distance(
                this.startPoint,
                endPoint
            );

        if (
            distance >=
            this.minimumRoadLength
        ) {

            this.createRoad(
                this.startPoint,
                endPoint
            );
        } else {

            this.notify(
                "Road Cancelled",
                "Drag farther to build a road."
            );
        }

        this.releasePointer();

        this.resetDrawing();

        this.hideIndicator();

        this.updateCursor();
    }


    /* ========================================================
       CANCEL
    ======================================================== */

    cancelDrawing(event) {

        if (
            !this.isDrawing
        ) {
            return;
        }

        if (
            event &&
            event.pointerId !==
            this.pointerId
        ) {
            return;
        }

        this.releasePointer();

        this.resetDrawing();

        this.hideIndicator();

        this.updateCursor();
    }


    releasePointer() {

        if (
            this.pointerId === null
        ) {
            return;
        }

        try {

            if (
                this.canvas.hasPointerCapture(
                    this.pointerId
                )
            ) {

                this.canvas.releasePointerCapture(
                    this.pointerId
                );
            }

        } catch (_) {}
    }


    /* ========================================================
       RESET
    ======================================================== */

    resetDrawing() {

        this.isDrawing = false;

        this.pointerId = null;

        this.startPoint = null;

        this.currentPoint = null;

        this.tempRoad = null;

        this.lastPointer = null;

        this.hasMoved = false;
    }


    cancel() {

        this.cancelDrawing();
    }


    /* ========================================================
       CREATE ROAD
    ======================================================== */

    createRoad(start, end) {

        if (!start || !end)
            return null;

        const length =
            this.distance(
                start,
                end
            );

        if (
            length <
            this.minimumRoadLength
        ) {

            return null;
        }

        const cost =
            Math.ceil(
                length *
                this.roadCostPerUnit
            );

        /*
         * Money validation.
         */

        if (
            Number(this.city.money) <
            cost
        ) {

            this.notify(
                "Not Enough Money",
                `This road costs $${cost.toLocaleString()}.`
            );

            return null;
        }

        /*
         * Duplicate check.
         */

        if (
            this.isDuplicateRoad(
                start,
                end
            )
        ) {

            this.notify(
                "Road Already Exists",
                "This road already exists."
            );

            return null;
        }

        /*
         * Prevent roads that are
         * almost completely overlapping.
         */

        if (
            this.overlapsExistingRoad(
                start,
                end
            )
        ) {

            this.notify(
                "Road Overlap",
                "This road overlaps an existing road."
            );

            return null;
        }

        /*
         * Create road object.
         */

        const road = {

            id:
                this.generateRoadId(),

            type:
                "road",

            x1:
                Number(start.x),

            y1:
                Number(start.y),

            x2:
                Number(end.x),

            y2:
                Number(end.y),

            width:
                this.roadWidth,

            length:
                length,

            cost:
                cost,

            createdAt:
                Date.now()
        };

        /*
         * Pay.
         */

        this.city.money -= cost;

        /*
         * Safety.
         */

        if (
            !Array.isArray(
                this.city.roads
            )
        ) {

            this.city.roads = [];
        }

        this.city.roads.push(
            road
        );

        /*
         * Statistics.
         */

        if (
            !this.city.statistics
        ) {

            this.city.statistics = {};
        }

        this.city.statistics.roadsBuilt =
            Number(
                this.city.statistics.roadsBuilt ||
                0
            ) + 1;

        this.city.statistics.totalExpenses =
            Number(
                this.city.statistics.totalExpenses ||
                0
            ) + cost;

        /*
         * Update intersections.
         */

        this.updateIntersections(
            road
        );

        /*
         * Notify.
         */

        this.notify(
            "Road Built",
            `${Math.round(length)}m road built for $${cost.toLocaleString()}.`
        );

        /*
         * Event for main.js.
         */

        window.dispatchEvent(
            new CustomEvent(
                "metrocity:roadCreated",
                {
                    detail: road
                }
            )
        );

        return road;
    }


    /* ========================================================
       ROAD ID
    ======================================================== */

    generateRoadId() {

        return (
            "road_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );
    }


    /* ========================================================
       SNAP SYSTEM
    ======================================================== */

    snapPoint(point) {

        if (!point) {

            return {
                x: 0,
                y: 0
            };
        }

        let best = null;

        let bestDistance =
            this.snapDistance;

        /*
         * 1. Existing road endpoints.
         */

        for (
            const road
            of this.city.roads || []
        ) {

            const candidates = [

                {
                    x:
                        Number(road.x1),

                    y:
                        Number(road.y1)
                },

                {
                    x:
                        Number(road.x2),

                    y:
                        Number(road.y2)
                }
            ];

            for (
                const candidate
                of candidates
            ) {

                const distance =
                    this.distance(
                        point,
                        candidate
                    );

                if (
                    distance <
                    bestDistance
                ) {

                    bestDistance =
                        distance;

                    best = {
                        x:
                            candidate.x,

                        y:
                            candidate.y
                    };
                }
            }
        }

        /*
         * 2. Existing intersections.
         */

        for (
            const intersection
            of this.city.intersections || []
        ) {

            const distance =
                this.distance(
                    point,
                    intersection
                );

            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;

                best = {

                    x:
                        intersection.x,

                    y:
                        intersection.y
                };
            }
        }

        /*
         * 3. Snap to existing road line.
         * This makes crossing roads much
         * easier to connect.
         */

        for (
            const road
            of this.city.roads || []
        ) {

            const projection =
                this.projectPointToRoad(
                    point,
                    road
                );

            if (!projection)
                continue;

            const distance =
                this.distance(
                    point,
                    projection
                );

            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;

                best = {
                    x:
                        projection.x,

                    y:
                        projection.y
                };
            }
        }

        /*
         * 4. Grid snapping.
         */

        if (best) {

            return best;
        }

        return {

            x:
                Math.round(
                    point.x /
                    this.gridSize
                ) *
                this.gridSize,

            y:
                Math.round(
                    point.y /
                    this.gridSize
                ) *
                this.gridSize
        };
    }


    /* ========================================================
       PROJECT POINT TO ROAD
    ======================================================== */

    projectPointToRoad(
        point,
        road
    ) {

        const ax =
            Number(road.x1);

        const ay =
            Number(road.y1);

        const bx =
            Number(road.x2);

        const by =
            Number(road.y2);

        const abx =
            bx - ax;

        const aby =
            by - ay;

        const lengthSquared =
            abx * abx +
            aby * aby;

        if (
            lengthSquared <=
            0.000001
        ) {

            return null;
        }

        const apx =
            point.x - ax;

        const apy =
            point.y - ay;

        let t =
            (
                apx * abx +
                apy * aby
            ) /
            lengthSquared;

        /*
         * Only project onto the
         * actual road segment.
         */

        t =
            Math.max(
                0,
                Math.min(
                    1,
                    t
                )
            );

        return {

            x:
                ax +
                abx * t,

            y:
                ay +
                aby * t
        };
    }


    /* ========================================================
       INTERSECTIONS
    ======================================================== */

    updateIntersections(
        road
    ) {

        if (
            !Array.isArray(
                this.city.intersections
            )
        ) {

            this.city.intersections =
                [];
        }

        /*
         * Endpoints.
         */

        this.addIntersection(
            road.x1,
            road.y1
        );

        this.addIntersection(
            road.x2,
            road.y2
        );

        /*
         * Crossing roads.
         */

        for (
            const existing
            of this.city.roads
        ) {

            if (
                existing.id ===
                road.id
            ) {
                continue;
            }

            const intersection =
                this.lineIntersection(
                    road,
                    existing
                );

            if (
                intersection
            ) {

                this.addIntersection(
                    intersection.x,
                    intersection.y
                );
            }
        }
    }


    addIntersection(
        x,
        y
    ) {

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y)
        ) {

            return;
        }

        const exists =
            this.city.intersections.some(
                item =>
                    this.distance(
                        item,
                        {
                            x,
                            y
                        }
                    ) <
                    this.intersectionTolerance
            );

        if (!exists) {

            this.city.intersections.push({

                x:
                    Number(x),

                y:
                    Number(y)
            });
        }
    }


    /* ========================================================
       LINE INTERSECTION
    ======================================================== */

    lineIntersection(
        a,
        b
    ) {

        const x1 =
            Number(a.x1);

        const y1 =
            Number(a.y1);

        const x2 =
            Number(a.x2);

        const y2 =
            Number(a.y2);

        const x3 =
            Number(b.x1);

        const y3 =
            Number(b.y1);

        const x4 =
            Number(b.x2);

        const y4 =
            Number(b.y2);

        const denominator =
            (
                (x1 - x2) *
                (y3 - y4)
            ) -
            (
                (y1 - y2) *
                (x3 - x4)
            );

        if (
            Math.abs(
                denominator
            ) <
            0.0001
        ) {

            return null;
        }

        const determinantA =
            x1 * y2 -
            y1 * x2;

        const determinantB =
            x3 * y4 -
            y3 * x4;

        const px =
            (
                determinantA *
                (x3 - x4) -
                (x1 - x2) *
                determinantB
            ) /
            denominator;

        const py =
            (
                determinantA *
                (y3 - y4) -
                (y1 - y2) *
                determinantB
            ) /
            denominator;

        if (
            this.pointOnSegment(
                px,
                py,
                a
            ) &&
            this.pointOnSegment(
                px,
                py,
                b
            )
        ) {

            return {

                x: px,

                y: py
            };
        }

        return null;
    }


    /* ========================================================
       POINT ON SEGMENT
    ======================================================== */

    pointOnSegment(
        x,
        y,
        road
    ) {

        const tolerance =
            this.intersectionTolerance;

        return (

            x >=
                Math.min(
                    road.x1,
                    road.x2
                ) -
                tolerance &&

            x <=
                Math.max(
                    road.x1,
                    road.x2
                ) +
                tolerance &&

            y >=
                Math.min(
                    road.y1,
                    road.y2
                ) -
                tolerance &&

            y <=
                Math.max(
                    road.y1,
                    road.y2
                ) +
                tolerance
        );
    }


    /* ========================================================
       DUPLICATE ROAD
    ======================================================== */

    isDuplicateRoad(
        start,
        end
    ) {

        for (
            const road
            of this.city.roads || []
        ) {

            const sameDirection =

                this.distance(
                    start,
                    {
                        x:
                            road.x1,

                        y:
                            road.y1
                    }
                ) < 10 &&

                this.distance(
                    end,
                    {
                        x:
                            road.x2,

                        y:
                            road.y2
                    }
                ) < 10;


            const reverseDirection =

                this.distance(
                    start,
                    {
                        x:
                            road.x2,

                        y:
                            road.y2
                    }
                ) < 10 &&

                this.distance(
                    end,
                    {
                        x:
                            road.x1,

                        y:
                            road.y1
                    }
                ) < 10;


            if (
                sameDirection ||
                reverseDirection
            ) {

                return true;
            }
        }

        return false;
    }


    /* ========================================================
       OVERLAP CHECK
    ======================================================== */

    overlapsExistingRoad(
        start,
        end
    ) {

        const midpoint = {

            x:
                (
                    start.x +
                    end.x
                ) / 2,

            y:
                (
                    start.y +
                    end.y
                ) / 2
        };

        for (
            const road
            of this.city.roads || []
        ) {

            const projection =
                this.projectPointToRoad(
                    midpoint,
                    road
                );

            if (!projection)
                continue;

            const distance =
                this.distance(
                    midpoint,
                    projection
                );

            if (
                distance <
                this.roadWidth * 0.45
            ) {

                const candidateLength =
                    this.distance(
                        start,
                        end
                    );

                const existingLength =
                    Number(
                        road.length ||
                        this.distance(
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
                        )
                    );

                /*
                 * Don't block a legitimate
                 * crossing road.
                 */

                if (
                    Math.abs(
                        candidateLength -
                        existingLength
                    ) <
                    Math.max(
                        20,
                        existingLength *
                        0.25
                    )
                ) {

                    return true;
                }
            }
        }

        return false;
    }


    /* ========================================================
       SCREEN → WORLD
       Compatible with:
       screenToWorld(clientX, clientY)
    ======================================================== */

    screenToWorld(
        screenX,
        screenY
    ) {

        const rect =
            this.canvas
                .getBoundingClientRect();

        const x =
            screenX -
            rect.left;

        const y =
            screenY -
            rect.top;

        const zoom =
            Math.max(
                Number(
                    this.camera.zoom
                ) || 1,
                0.0001
            );

        return {

            x:
                (
                    x -
                    rect.width / 2 -
                    Number(
                        this.camera.x
                    )
                ) /
                zoom,

            y:
                (
                    y -
                    rect.height / 2 -
                    Number(
                        this.camera.y
                    )
                ) /
                zoom
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
            this.canvas
                .getBoundingClientRect();

        const zoom =
            Math.max(
                Number(
                    this.camera.zoom
                ) || 1,
                0.0001
            );

        return {

            x:
                rect.width / 2 +
                Number(
                    this.camera.x
                ) +
                worldX *
                zoom,

            y:
                rect.height / 2 +
                Number(
                    this.camera.y
                ) +
                worldY *
                zoom
        };
    }


    /* ========================================================
       DRAW ALL ROADS
       main.js calls roadEngine.draw(ctx)
    ======================================================== */

    draw(ctx) {

        if (!ctx)
            return;

        for (
            const road
            of this.city.roads || []
        ) {

            this.drawRoad(
                ctx,
                road
            );
        }

        /*
         * Draw intersections on top.
         */

        this.drawIntersections(
            ctx
        );
    }


    /* ========================================================
       DRAW SINGLE ROAD
    ======================================================== */

    drawRoad(
        ctx,
        road
    ) {

        if (!road)
            return;

        const x1 =
            Number(road.x1);

        const y1 =
            Number(road.y1);

        const x2 =
            Number(road.x2);

        const y2 =
            Number(road.y2);

        const width =
            Number(
                road.width ||
                this.roadWidth
            );

        ctx.save();

        ctx.lineCap =
            "round";

        ctx.lineJoin =
            "round";

        /*
         * Road shadow.
         */

        ctx.strokeStyle =
            "rgba(0,0,0,.38)";

        ctx.lineWidth =
            width + 10;

        ctx.beginPath();

        ctx.moveTo(
            x1,
            y1
        );

        ctx.lineTo(
            x2,
            y2
        );

        ctx.stroke();


        /*
         * Main asphalt.
         */

        ctx.strokeStyle =
            "#343a40";

        ctx.lineWidth =
            width;

        ctx.beginPath();

        ctx.moveTo(
            x1,
            y1
        );

        ctx.lineTo(
            x2,
            y2
        );

        ctx.stroke();


        /*
         * Road edge.
         */

        ctx.strokeStyle =
            "rgba(255,255,255,.08)";

        ctx.lineWidth =
            width - 2;

        ctx.beginPath();

        ctx.moveTo(
            x1,
            y1
        );

        ctx.lineTo(
            x2,
            y2
        );

        ctx.stroke();


        /*
         * Center lane marking.
         */

        ctx.strokeStyle =
            "rgba(255,210,70,.82)";

        ctx.lineWidth =
            2;

        ctx.setLineDash([
            14,
            12
        ]);

        ctx.beginPath();

        ctx.moveTo(
            x1,
            y1
        );

        ctx.lineTo(
            x2,
            y2
        );

        ctx.stroke();

        ctx.setLineDash([]);

        ctx.restore();
    }


    /* ========================================================
       DRAW INTERSECTIONS
    ======================================================== */

    drawIntersections(
        ctx
    ) {

        for (
            const intersection
            of this.city.intersections || []
        ) {

            ctx.save();

            ctx.fillStyle =
                "#30363b";

            ctx.beginPath();

            ctx.arc(
                intersection.x,
                intersection.y,
                this.roadWidth / 2 + 2,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        }
    }


    /* ========================================================
       PREVIEW
    ======================================================== */

    drawPreview(ctx) {

        if (
            !this.isDrawing ||
            !this.tempRoad
        ) {

            return;
        }

        const road =
            this.tempRoad;

        const length =
            this.distance(
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
            );

        const cost =
            Math.ceil(
                length *
                this.roadCostPerUnit
            );

        const affordable =
            Number(
                this.city.money
            ) >= cost;

        ctx.save();

        ctx.lineCap =
            "round";

        /*
         * Preview shadow.
         */

        ctx.strokeStyle =
            "rgba(0,0,0,.4)";

        ctx.lineWidth =
            this.roadWidth + 10;

        ctx.beginPath();

        ctx.moveTo(
            road.x1,
            road.y1
        );

        ctx.lineTo(
            road.x2,
            road.y2
        );

        ctx.stroke();


        /*
         * Preview body.
         */

        ctx.strokeStyle =
            affordable
                ? "rgba(115,125,135,.9)"
                : "rgba(190,70,70,.9)";

        ctx.lineWidth =
            this.roadWidth;

        ctx.beginPath();

        ctx.moveTo(
            road.x1,
            road.y1
        );

        ctx.lineTo(
            road.x2,
            road.y2
        );

        ctx.stroke();


        /*
         * Center line.
         */

        ctx.strokeStyle =
            affordable
                ? "rgba(255,255,255,.75)"
                : "rgba(255,180,180,.85)";

        ctx.lineWidth =
            2;

        ctx.setLineDash([
            10,
            8
        ]);

        ctx.beginPath();

        ctx.moveTo(
            road.x1,
            road.y1
        );

        ctx.lineTo(
            road.x2,
            road.y2
        );

        ctx.stroke();

        ctx.setLineDash([]);


        /*
         * Start point.
         */

        ctx.fillStyle =
            "#ffffff";

        ctx.beginPath();

        ctx.arc(
            road.x1,
            road.y1,
            6,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         * End point.
         */

        ctx.beginPath();

        ctx.arc(
            road.x2,
            road.y2,
            6,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         * Cost label.
         */

        this.drawCostLabel(
            ctx,
            road,
            length,
            cost,
            affordable
        );

        ctx.restore();
    }


    /* ========================================================
       COST LABEL
    ======================================================== */

    drawCostLabel(
        ctx,
        road,
        length,
        cost,
        affordable
    ) {

        const centerX =
            (
                road.x1 +
                road.x2
            ) / 2;

        const centerY =
            (
                road.y1 +
                road.y2
            ) / 2;

        const label =
            `$${cost.toLocaleString()}`;

        ctx.save();

        ctx.font =
            "bold 11px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        const metrics =
            ctx.measureText(
                label
            );

        const boxWidth =
            metrics.width + 18;

        const boxHeight =
            22;

        ctx.fillStyle =
            affordable
                ? "rgba(8,12,16,.9)"
                : "rgba(90,20,20,.94)";

        ctx.beginPath();

        ctx.roundRect(
            centerX -
                boxWidth / 2,

            centerY -
                boxHeight / 2,

            boxWidth,

            boxHeight,

            7
        );

        ctx.fill();


        ctx.fillStyle =
            "#ffffff";

        ctx.fillText(
            label,
            centerX,
            centerY
        );

        ctx.restore();
    }


    /* ========================================================
       PREVIEW INDICATOR
    ======================================================== */

    updatePreviewIndicator() {

        if (
            !this.isDrawing ||
            !this.tempRoad
        ) {

            return;
        }

        const length =
            this.distance(
                {
                    x:
                        this.tempRoad.x1,

                    y:
                        this.tempRoad.y1
                },
                {
                    x:
                        this.tempRoad.x2,

                    y:
                        this.tempRoad.y2
                }
            );

        const cost =
            Math.ceil(
                length *
                this.roadCostPerUnit
            );

        const affordable =
            Number(
                this.city.money
            ) >= cost;

        this.showIndicator(

            `Road • ${Math.round(length)}m • $${cost.toLocaleString()}`
            +
            (
                affordable
                    ? ""
                    : " • NOT ENOUGH MONEY"
            )
        );
    }


    /* ========================================================
       FIND ROAD AT POINT
    ======================================================== */

    findRoadAt(
        point,
        tolerance =
            this.roadHitTolerance
    ) {

        if (!point)
            return null;

        let closest = null;

        let closestDistance =
            tolerance;

        for (
            const road
            of this.city.roads || []
        ) {

            const projected =
                this.projectPointToRoad(
                    point,
                    road
                );

            if (!projected)
                continue;

            const distance =
                this.distance(
                    point,
                    projected
                );

            if (
                distance <
                closestDistance
            ) {

                closestDistance =
                    distance;

                closest =
                    road;
            }
        }

        return closest;
    }


    /* ========================================================
       DEMOLISH ROAD
    ======================================================== */

    demolishRoad(
        road
    ) {

        if (!road)
            return false;

        const roads =
            this.city.roads || [];

        const index =
            roads.findIndex(
                item =>
                    item.id ===
                    road.id
            );

        if (
            index === -1
        ) {

            return false;
        }

        roads.splice(
            index,
            1
        );

        /*
         * Rebuild intersections.
         */

        this.rebuildIntersections();

        /*
         * Optional refund.
         */

        const refund =
            Math.floor(
                Number(
                    road.cost || 0
                ) * 0.25
            );

        this.city.money =
            Number(
                this.city.money || 0
            ) +
            refund;

        this.notify(
            "Road Removed",
            `Road removed. $${refund.toLocaleString()} refunded.`
        );

        window.dispatchEvent(
            new CustomEvent(
                "metrocity:roadRemoved",
                {
                    detail: road
                }
            )
        );

        return true;
    }


    /* ========================================================
       REBUILD INTERSECTIONS
    ======================================================== */

    rebuildIntersections() {

        this.city.intersections =
            [];

        for (
            const road
            of this.city.roads || []
        ) {

            this.updateIntersections(
                road
            );
        }
    }


    /* ========================================================
       DISTANCE
    ======================================================== */

    distance(
        a,
        b
    ) {

        return Math.hypot(
            Number(b.x) -
            Number(a.x),

            Number(b.y) -
            Number(a.y)
        );
    }


    /* ========================================================
       NOTIFICATION
    ======================================================== */

    notify(
        title,
        text
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "metrocity:notification",
                {
                    detail: {

                        title:
                            title,

                        text:
                            text
                    }
                }
            )
        );
    }


    /* ========================================================
       TOOL INDICATOR
    ======================================================== */

    showIndicator(
        text
    ) {

        const element =
            document.getElementById(
                "toolIndicator"
            );

        if (!element)
            return;

        element.textContent =
            text;

        element.classList.add(
            "show"
        );
    }


    hideIndicator() {

        const element =
            document.getElementById(
                "toolIndicator"
            );

        if (!element)
            return;

        element.classList.remove(
            "show"
        );
    }


    /* ========================================================
       CLEANUP
    ======================================================== */

    destroy() {

        this.resetDrawing();

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

        this.hideIndicator();
    }

}
