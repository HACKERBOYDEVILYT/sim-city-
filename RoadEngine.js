// MetroCity V5
// Road Engine v1
// Free-form road drawing + snapping + intersections

export class RoadEngine {

    constructor(canvas, city, camera) {

        this.canvas = canvas;
        this.city = city;
        this.camera = camera;

        this.drawing = false;

        this.start = null;
        this.current = null;

        this.snapDistance = 35;

        this.preview = null;

        this.bindEvents();
    }

    // ---------------------------------
    // INPUT
    // ---------------------------------

    bindEvents() {

        this.canvas.addEventListener(
            "pointerdown",
            (event) => this.pointerDown(event)
        );

        this.canvas.addEventListener(
            "pointermove",
            (event) => this.pointerMove(event)
        );

        this.canvas.addEventListener(
            "pointerup",
            (event) => this.pointerUp(event)
        );

        this.canvas.addEventListener(
            "pointercancel",
            () => this.cancel()
        );
    }

    // ---------------------------------
    // POINTER DOWN
    // ---------------------------------

    pointerDown(event) {

        if (this.city.currentTool !== "road")
            return;

        const point = this.screenToWorld(
            event.clientX,
            event.clientY
        );

        const snapped = this.snapPoint(point);

        this.drawing = true;

        this.start = snapped;

        this.current = snapped;

        this.preview = {
            x1: snapped.x,
            y1: snapped.y,
            x2: snapped.x,
            y2: snapped.y
        };

        this.canvas.setPointerCapture(
            event.pointerId
        );
    }

    // ---------------------------------
    // POINTER MOVE
    // ---------------------------------

    pointerMove(event) {

        if (!this.drawing)
            return;

        const point = this.screenToWorld(
            event.clientX,
            event.clientY
        );

        const snapped = this.snapPoint(point);

        this.current = snapped;

        this.preview = {
            x1: this.start.x,
            y1: this.start.y,
            x2: snapped.x,
            y2: snapped.y
        };
    }

    // ---------------------------------
    // POINTER UP
    // ---------------------------------

    pointerUp(event) {

        if (!this.drawing)
            return;

        const point = this.screenToWorld(
            event.clientX,
            event.clientY
        );

        const snapped = this.snapPoint(point);

        const distance = this.distance(
            this.start,
            snapped
        );

        // Ignore tiny movements
        if (distance < 15) {

            this.cancel();

            return;
        }

        this.createRoad(
            this.start,
            snapped
        );

        this.drawing = false;

        this.start = null;
        this.current = null;
        this.preview = null;
    }

    // ---------------------------------
    // CREATE ROAD
    // ---------------------------------

    createRoad(start, end) {

        const road = {

            id: this.generateId(),

            x1: start.x,
            y1: start.y,

            x2: end.x,
            y2: end.y,

            type: "local",

            lanes: 2,

            speedLimit: 40,

            length: this.distance(
                start,
                end
            ),

            traffic: 0,

            capacity: 100,

            createdAt: Date.now()
        };

        this.city.roads.push(road);

        this.connectIntersections(road);

        this.city.money -= Math.max(
            20,
            Math.floor(road.length * 2)
        );

        this.emitRoadCreated(road);
    }

    // ---------------------------------
    // INTERSECTIONS
    // ---------------------------------

    connectIntersections(newRoad) {

        for (const road of this.city.roads) {

            if (road.id === newRoad.id)
                continue;

            const intersection =
                this.lineIntersection(
                    newRoad,
                    road
                );

            if (!intersection)
                continue;

            if (
                intersection.t < 0 ||
                intersection.t > 1 ||
                intersection.u < 0 ||
                intersection.u > 1
            ) {
                continue;
            }

            this.createIntersection(
                intersection.x,
                intersection.y,
                newRoad.id,
                road.id
            );
        }
    }

    createIntersection(
        x,
        y,
        roadA,
        roadB
    ) {

        if (!this.city.intersections)
            this.city.intersections = [];

        const exists =
            this.city.intersections.some(
                item =>
                    this.distance(
                        item,
                        { x, y }
                    ) < 10
            );

        if (exists)
            return;

        this.city.intersections.push({

            id: this.generateId(),

            x,
            y,

            roads: [
                roadA,
                roadB
            ],

            trafficLight: false,

            stopSigns: false,

            roundabout: false
        });
    }

    // ---------------------------------
    // SNAP SYSTEM
    // ---------------------------------

    snapPoint(point) {

        let closest = null;

        let closestDistance =
            this.snapDistance;

        // Snap to road endpoints
        for (const road of this.city.roads) {

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

            for (const candidate of points) {

                const distance =
                    this.distance(
                        point,
                        candidate
                    );

                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;

                    closest = candidate;
                }
            }
        }

        // Snap to intersections
        if (this.city.intersections) {

            for (
                const intersection
                of this.city.intersections
            ) {

                const distance =
                    this.distance(
                        point,
                        intersection
                    );

                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;

                    closest = {
                        x: intersection.x,
                        y: intersection.y
                    };
                }
            }
        }

        if (closest)
            return closest;

        return point;
    }

    // ---------------------------------
    // WORLD COORDINATES
    // ---------------------------------

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
                    window.innerWidth / 2 -
                    this.camera.x
                ) /
                this.camera.zoom,

            y:
                (
                    y -
                    window.innerHeight / 2 -
                    this.camera.y
                ) /
                this.camera.zoom
        };
    }

    // ---------------------------------
    // LINE INTERSECTION
    // ---------------------------------

    lineIntersection(
        a,
        b
    ) {

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

        if (Math.abs(denominator) < 0.0001)
            return null;

        const t =
            (
                (x1 - x3) *
                (y3 - y4) -
                (y1 - y3) *
                (x3 - x4)
            ) /
            denominator;

        const u =
            -(
                (x1 - x2) *
                (y1 - y3) -
                (y1 - y2) *
                (x1 - x3)
            ) /
            denominator;

        return {

            x:
                x1 +
                t * (x2 - x1),

            y:
                y1 +
                t * (y2 - y1),

            t,
            u
        };
    }

    // ---------------------------------
    // DISTANCE
    // ---------------------------------

    distance(a, b) {

        const dx =
            a.x - b.x;

        const dy =
            a.y - b.y;

        return Math.sqrt(
            dx * dx +
            dy * dy
        );
    }

    // ---------------------------------
    // CANCEL
    // ---------------------------------

    cancel() {

        this.drawing = false;

        this.start = null;

        this.current = null;

        this.preview = null;
    }

    // ---------------------------------
    // PREVIEW
    // ---------------------------------

    drawPreview(ctx) {

        if (!this.preview)
            return;

        ctx.save();

        ctx.lineCap = "round";

        // Outer road
        ctx.strokeStyle =
            "rgba(20,20,20,0.8)";

        ctx.lineWidth = 38;

        ctx.beginPath();

        ctx.moveTo(
            this.preview.x1,
            this.preview.y1
        );

        ctx.lineTo(
            this.preview.x2,
            this.preview.y2
        );

        ctx.stroke();

        // Road surface
        ctx.strokeStyle =
            "rgba(150,150,150,0.9)";

        ctx.lineWidth = 28;

        ctx.beginPath();

        ctx.moveTo(
            this.preview.x1,
            this.preview.y1
        );

        ctx.lineTo(
            this.preview.x2,
            this.preview.y2
        );

        ctx.stroke();

        // Center marking
        ctx.strokeStyle =
            "rgba(255,255,255,0.65)";

        ctx.lineWidth = 2;

        ctx.setLineDash([
            10,
            10
        ]);

        ctx.beginPath();

        ctx.moveTo(
            this.preview.x1,
            this.preview.y1
        );

        ctx.lineTo(
            this.preview.x2,
            this.preview.y2
        );

        ctx.stroke();

        ctx.setLineDash([]);

        ctx.restore();
    }

    // ---------------------------------
    // EVENT
    // ---------------------------------

    emitRoadCreated(road) {

        window.dispatchEvent(
            new CustomEvent(
                "metrocity:roadCreated",
                {
                    detail: road
                }
            )
        );
    }

    // ---------------------------------
    // ID
    // ---------------------------------

    generateId() {

        return (
            "road_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );
    }
}
