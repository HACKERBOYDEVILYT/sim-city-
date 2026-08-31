/* ============================================================
   MetroCity V5 — RoadEngine
   Professional road drawing + snapping + preview
============================================================ */

export class RoadEngine {

    constructor(canvas, city, camera) {

        this.canvas = canvas;
        this.city = city;
        this.camera = camera;

        this.isDrawing = false;

        this.startPoint = null;
        this.currentPoint = null;

        this.pointerId = null;

        this.roadWidth = 28;
        this.roadCostPerUnit = 20;

        this.snapDistance = 24;

        this.tempRoad = null;

        this.bindEvents();
    }


    /* ========================================================
       EVENTS
    ======================================================== */

    bindEvents() {

        this.canvas.addEventListener(
            "pointerdown",
            event => this.pointerDown(event)
        );

        this.canvas.addEventListener(
            "pointermove",
            event => this.pointerMove(event)
        );

        this.canvas.addEventListener(
            "pointerup",
            event => this.pointerUp(event)
        );

        this.canvas.addEventListener(
            "pointercancel",
            event => this.cancelDrawing(event)
        );
    }


    /* ========================================================
       POINTER DOWN
    ======================================================== */

    pointerDown(event) {

        if (
            this.city.currentTool !== "road"
        ) {
            return;
        }

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

        this.startPoint =
            snapped;

        this.currentPoint =
            snapped;

        this.tempRoad = {
            x1: snapped.x,
            y1: snapped.y,
            x2: snapped.x,
            y2: snapped.y
        };

        this.canvas.setPointerCapture(
            event.pointerId
        );

        this.showIndicator(
            "Road: drag to draw"
        );
    }


    /* ========================================================
       POINTER MOVE
    ======================================================== */

    pointerMove(event) {

        if (!this.isDrawing) {
            return;
        }

        if (
            event.pointerId !==
            this.pointerId
        ) {
            return;
        }

        const point =
            this.screenToWorld(
                event.clientX,
                event.clientY
            );

        const snapped =
            this.snapPoint(point);

        this.currentPoint =
            snapped;

        this.tempRoad.x2 =
            snapped.x;

        this.tempRoad.y2 =
            snapped.y;
    }


    /* ========================================================
       POINTER UP
    ======================================================== */

    pointerUp(event) {

        if (!this.isDrawing) {
            return;
        }

        if (
            event.pointerId !==
            this.pointerId
        ) {
            return;
        }

        const endPoint =
            this.snapPoint(
                this.currentPoint
            );

        const distance =
            this.distance(
                this.startPoint,
                endPoint
            );

        /*
         * Ignore tiny accidental taps.
         */

        if (distance >= 20) {

            this.createRoad(
                this.startPoint,
                endPoint
            );

        }

        this.resetDrawing();

        this.hideIndicator();
    }


    /* ========================================================
       CANCEL
    ======================================================== */

    cancelDrawing(event) {

        if (
            event.pointerId ===
            this.pointerId
        ) {
            this.resetDrawing();
        }
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
    }


    /* ========================================================
       CREATE ROAD
    ======================================================== */

    createRoad(start, end) {

        const length =
            this.distance(
                start,
                end
            );

        const cost =
            Math.ceil(
                length *
                this.roadCostPerUnit
            );


        /*
         * Not enough money
         */

        if (
            this.city.money <
            cost
        ) {

            this.notify(
                "Not Enough Money",
                `This road costs $${cost.toLocaleString()}.`
            );

            return;
        }


        /*
         * Prevent duplicate tiny roads.
         */

        if (
            this.isDuplicateRoad(
                start,
                end
            )
        ) {

            this.notify(
                "Road Already Exists",
                "This road overlaps an existing road."
            );

            return;
        }


        const road = {

            id:
                "road_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2, 8),

            x1:
                start.x,

            y1:
                start.y,

            x2:
                end.x,

            y2:
                end.y,

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
         * Pay
         */

        this.city.money -=
            cost;


        /*
         * Save road
         */

        this.city.roads.push(
            road
        );


        /*
         * Create intersections
         */

        this.updateIntersections(
            road
        );


        /*
         * Notify UI
         */

        this.notify(
            "Road Built",
            `${Math.round(length)}m road built for $${cost.toLocaleString()}.`
        );


        window.dispatchEvent(
            new CustomEvent(
                "metrocity:roadCreated",
                {
                    detail: road
                }
            )
        );
    }


    /* ========================================================
       SNAP SYSTEM
    ======================================================== */

    snapPoint(point) {

        let best = null;

        let bestDistance =
            this.snapDistance;


        /*
         * Snap to existing road endpoints.
         */

        for (
            const road
            of this.city.roads
        ) {

            const points = [

                {
                    x: road.x1,
                    y: road.y1
                },

                {
                    x: road.x2,
                    y: road.y2
                }

            ];


            for (
                const candidate
                of points
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
                        x: candidate.x,
                        y: candidate.y
                    };
                }
            }
        }


        /*
         * Snap to intersections.
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
         * Snap to grid if nothing
         * else is close.
         */

        if (best) {

            return best;
        }


        const grid =
            10;


        return {

            x:
                Math.round(
                    point.x / grid
                ) * grid,

            y:
                Math.round(
                    point.y / grid
                ) * grid

        };
    }


    /* ========================================================
       INTERSECTIONS
    ======================================================== */

    updateIntersections(road) {

        if (
            !Array.isArray(
                this.city.intersections
            )
        ) {

            this.city.intersections =
                [];
        }


        this.addIntersection(
            road.x1,
            road.y1
        );


        this.addIntersection(
            road.x2,
            road.y2
        );


        /*
         * Check crossing roads.
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


            if (intersection) {

                this.addIntersection(
                    intersection.x,
                    intersection.y
                );

            }
        }
    }


    addIntersection(x, y) {

        const exists =
            this.city.intersections.some(
                item =>
                    this.distance(
                        item,
                        { x, y }
                    ) < 10
            );


        if (!exists) {

            this.city.intersections.push({
                x,
                y
            });

        }
    }


    /* ========================================================
       LINE INTERSECTION
    ======================================================== */

    lineIntersection(a, b) {

        const x1 = a.x1;
        const y1 = a.y1;

        const x2 = a.x2;
        const y2 = a.y2;

        const x3 = b.x1;
        const y3 = b.y1;

        const x4 = b.x2;
        const y4 = b.y2;


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
            ) < 0.0001
        ) {

            return null;
        }


        const px =
            (
                (
                    x1 * y2 -
                    y1 * x2
                ) *
                (x3 - x4) -

                (
                    x1 - x2
                ) *
                (
                    x3 * y4 -
                    y3 * x4
                )
            ) /
            denominator;


        const py =
            (
                (
                    x1 * y2 -
                    y1 * x2
                ) *
                (y3 - y4) -

                (
                    y1 - y2
                ) *
                (
                    x3 * y4 -
                    y3 * x4
                )
            ) /
            denominator;


        const onA =
            this.pointOnSegment(
                px,
                py,
                a
            );


        const onB =
            this.pointOnSegment(
                px,
                py,
                b
            );


        if (
            onA &&
            onB
        ) {

            return {
                x: px,
                y: py
            };

        }


        return null;
    }


    pointOnSegment(
        x,
        y,
        road
    ) {

        const tolerance = 1;


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
       DUPLICATE ROAD CHECK
    ======================================================== */

    isDuplicateRoad(
        start,
        end
    ) {

        for (
            const road
            of this.city.roads
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
       SCREEN → WORLD
    ======================================================== */

    screenToWorld(
        screenX,
        screenY
    ) {

        const rect =
            this.canvas.getBoundingClientRect();


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
                    this.camera.x
                ) /
                this.camera.zoom,

            y:
                (
                    y -
                    rect.height / 2 -
                    this.camera.y
                ) /
                this.camera.zoom

        };
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


        /*
         * Outer shadow.
         */

        ctx.save();

        ctx.lineCap =
            "round";


        ctx.strokeStyle =
            "rgba(0,0,0,.35)";

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
         * Road preview.
         */

        ctx.strokeStyle =
            "rgba(120,130,140,.85)";

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
            "rgba(255,255,255,.55)";

        ctx.lineWidth = 2;

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
            "rgba(255,255,255,.9)";


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
         * Cost indicator.
         */

        const length =
            this.distance(
                {
                    x: road.x1,
                    y: road.y1
                },
                {
                    x: road.x2,
                    y: road.y2
                }
            );


        const cost =
            Math.ceil(
                length *
                this.roadCostPerUnit
            );


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


        ctx.font =
            "bold 11px Arial";


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        const label =
            `$${cost.toLocaleString()}`;


        const metrics =
            ctx.measureText(
                label
            );


        ctx.fillStyle =
            "rgba(8,12,16,.88)";


        ctx.beginPath();

        ctx.roundRect(
            centerX -
                metrics.width / 2 -
                8,

            centerY -
                10,

            metrics.width + 16,

            20,

            7
        );

        ctx.fill();


        ctx.fillStyle =
            "white";


        ctx.fillText(
            label,
            centerX,
            centerY
        );


        ctx.restore();
    }


    /* ========================================================
       UTILITY
    ======================================================== */

    distance(a, b) {

        return Math.hypot(
            b.x - a.x,
            b.y - a.y
        );
    }


    /* ========================================================
       UI NOTIFICATION
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
                        title,
                        text
                    }
                }
            )
        );
    }


    showIndicator(text) {

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

}
