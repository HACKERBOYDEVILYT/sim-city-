/* ============================================================
   METROCITY V5 — Renderer
   Professional Canvas Renderer
   Ground + Grid + Roads + Buildings + Selection + Preview
============================================================ */

import { BuildingEngine } from "./BuildingEngine.js";


export class Renderer {

    constructor(
        canvas,
        ctx,
        city,
        camera,
        world,
        roadEngine = null,
        buildingEngine = null
    ) {

        this.canvas =
            canvas;

        this.ctx =
            ctx;

        this.city =
            city;

        this.camera =
            camera;

        this.world =
            world;

        this.roadEngine =
            roadEngine;

        this.buildingEngine =
            buildingEngine;


        this.dpr =
            window.devicePixelRatio || 1;


        this.width =
            canvas.clientWidth ||
            window.innerWidth;


        this.height =
            canvas.clientHeight ||
            window.innerHeight;


        this.animationTime =
            0;


        this.showGrid =
            true;


        this.showLabels =
            true;


        this.showShadows =
            true;


        this.bindEvents();

    }


    /* ========================================================
       EVENTS
    ======================================================== */

    bindEvents() {

        window.addEventListener(
            "resize",
            () => {

                this.width =
                    this.canvas.clientWidth ||
                    window.innerWidth;

                this.height =
                    this.canvas.clientHeight ||
                    window.innerHeight;

            }
        );

    }


    /* ========================================================
       RENDER
    ======================================================== */

    render(
        delta = 16
    ) {

        this.animationTime +=
            delta / 1000;


        const ctx =
            this.ctx;


        ctx.clearRect(
            0,
            0,
            this.width,
            this.height
        );


        this.drawBackground();


        ctx.save();


        /*
         * Camera transform.
         */

        ctx.translate(
            this.width / 2 +
            this.camera.x,

            this.height / 2 +
            this.camera.y
        );


        ctx.scale(
            this.camera.zoom,
            this.camera.zoom
        );


        this.drawGround();


        if (
            this.showGrid
        ) {

            this.drawGrid();

        }


        this.drawRoads();

        this.drawBuildings();

        this.drawSelection();

        this.drawBuildingPreview();

        this.drawRoadPreview();


        ctx.restore();

    }


    /* ========================================================
       BACKGROUND
    ======================================================== */

    drawBackground() {

        const ctx =
            this.ctx;


        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                0,
                this.height
            );


        gradient.addColorStop(
            0,
            "#0c141b"
        );


        gradient.addColorStop(
            0.5,
            "#111d24"
        );


        gradient.addColorStop(
            1,
            "#081016"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            0,
            0,
            this.width,
            this.height
        );

    }


    /* ========================================================
       GROUND
    ======================================================== */

    drawGround() {

        const ctx =
            this.ctx;


        const size =
            this.world?.size ||
            2400;


        const half =
            size / 2;


        /*
         * Main terrain.
         */

        ctx.fillStyle =
            "#293c2f";


        ctx.fillRect(
            -half,
            -half,
            size,
            size
        );


        /*
         * Subtle terrain gradient.
         */

        const gradient =
            ctx.createRadialGradient(
                0,
                0,
                50,
                0,
                0,
                half
            );


        gradient.addColorStop(
            0,
            "rgba(120,160,110,.08)"
        );


        gradient.addColorStop(
            1,
            "rgba(0,0,0,.20)"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            -half,
            -half,
            size,
            size
        );


        /*
         * World boundary.
         */

        ctx.strokeStyle =
            "rgba(255,255,255,.10)";


        ctx.lineWidth =
            3;


        ctx.strokeRect(
            -half,
            -half,
            size,
            size
        );

    }


    /* ========================================================
       GRID
    ======================================================== */

    drawGrid() {

        const ctx =
            this.ctx;


        const gridSize =
            100;


        const range =
            Math.max(
                1400,
                (this.world?.size || 2400) / 2
            );


        /*
         * Major grid.
         */

        ctx.save();


        ctx.strokeStyle =
            "rgba(255,255,255,.035)";


        ctx.lineWidth =
            1 /
            Math.max(
                this.camera.zoom,
                0.5
            );


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


        /*
         * Small grid dots.
         */

        if (
            this.camera.zoom >= 1.3
        ) {

            ctx.fillStyle =
                "rgba(255,255,255,.045)";


            const smallGrid =
                20;


            for (
                let x = -range;
                x <= range;
                x += smallGrid
            ) {

                for (
                    let y = -range;
                    y <= range;
                    y += smallGrid
                ) {

                    ctx.fillRect(
                        x - 0.5,
                        y - 0.5,
                        1,
                        1
                    );

                }

            }

        }


        ctx.restore();

    }


    /* ========================================================
       ROADS
    ======================================================== */

    drawRoads() {

        /*
         * Prefer RoadEngine renderer.
         */

        if (
            this.roadEngine &&
            typeof this.roadEngine.draw ===
            "function"
        ) {

            this.roadEngine.draw(
                this.ctx
            );

            return;

        }


        /*
         * Fallback renderer.
         */

        const roads =
            Array.isArray(
                this.city.roads
            )
                ? this.city.roads
                : [];


        for (
            const road
            of roads
        ) {

            this.drawSingleRoad(
                road
            );

        }

    }


    /* ========================================================
       SINGLE ROAD
    ======================================================== */

    drawSingleRoad(
        road
    ) {

        if (!road)
            return;


        const ctx =
            this.ctx;


        let points =
            road.points;


        /*
         * Support x1/y1/x2/y2 format.
         */

        if (
            (
                !Array.isArray(points) ||
                points.length < 2
            ) &&
            Number.isFinite(road.x1) &&
            Number.isFinite(road.y1) &&
            Number.isFinite(road.x2) &&
            Number.isFinite(road.y2)
        ) {

            points = [

                {
                    x: road.x1,
                    y: road.y1
                },

                {
                    x: road.x2,
                    y: road.y2
                }

            ];

        }


        if (
            !Array.isArray(points) ||
            points.length < 2
        ) {

            return;

        }


        const width =
            Number(
                road.width || 24
            );


        ctx.save();


        ctx.lineCap =
            "round";


        ctx.lineJoin =
            "round";


        /*
         * Road shadow.
         */

        if (
            this.showShadows
        ) {

            ctx.strokeStyle =
                "rgba(0,0,0,.35)";


            ctx.lineWidth =
                width + 10;


            this.strokePoints(
                points
            );

        }


        /*
         * Road base.
         */

        ctx.strokeStyle =
            "#20262b";


        ctx.lineWidth =
            width;


        this.strokePoints(
            points
        );


        /*
         * Road surface.
         */

        ctx.strokeStyle =
            "#343b40";


        ctx.lineWidth =
            Math.max(
                4,
                width - 7
            );


        this.strokePoints(
            points
        );


        /*
         * Road center marking.
         */

        if (
            width >= 18
        ) {

            ctx.strokeStyle =
                "rgba(236,207,103,.65)";


            ctx.lineWidth =
                Math.max(
                    1.5,
                    width * .045
                );


            ctx.setLineDash([
                12,
                10
            ]);


            this.strokePoints(
                points
            );


            ctx.setLineDash([]);

        }


        ctx.restore();

    }


    /* ========================================================
       STROKE POINTS
    ======================================================== */

    strokePoints(
        points
    ) {

        const ctx =
            this.ctx;


        ctx.beginPath();


        for (
            let i = 0;
            i < points.length;
            i++
        ) {

            const point =
                points[i];


            if (
                i === 0
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


        ctx.stroke();

    }


    /* ========================================================
       BUILDINGS
    ======================================================== */

    drawBuildings() {

        const buildings =
            Array.isArray(
                this.city.buildings
            )
                ? this.city.buildings
                : [];


        /*
         * Render back-to-front.
         */

        const sorted =
            [...buildings].sort(
                (
                    a,
                    b
                ) =>
                    a.y - b.y
            );


        for (
            const building
            of sorted
        ) {

            this.drawBuilding(
                building
            );

        }

    }


    /* ========================================================
       BUILDING
    ======================================================== */

    drawBuilding(
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


        const ctx =
            this.ctx;


        const size =
            Number(
                building.size ||
                data.size ||
                50
            );


        const half =
            size / 2;


        ctx.save();


        ctx.translate(
            building.x,
            building.y
        );


        /*
         * Shadow.
         */

        if (
            this.showShadows
        ) {

            ctx.fillStyle =
                "rgba(0,0,0,.32)";


            ctx.beginPath();


            ctx.roundRect(
                -half + 7,
                -half + 9,
                size,
                size,
                8
            );


            ctx.fill();

        }


        /*
         * Main building.
         */

        ctx.fillStyle =
            data.color ||
            "#59636d";


        ctx.beginPath();


        ctx.roundRect(
            -half,
            -half,
            size,
            size,
            Math.min(
                9,
                size * .12
            )
        );


        ctx.fill();


        /*
         * Building highlight.
         */

        const gradient =
            ctx.createLinearGradient(
                -half,
                -half,
                half,
                half
            );


        gradient.addColorStop(
            0,
            "rgba(255,255,255,.15)"
        );


        gradient.addColorStop(
            0.45,
            "rgba(255,255,255,0)"
        );


        gradient.addColorStop(
            1,
            "rgba(0,0,0,.20)"
        );


        ctx.fillStyle =
            gradient;


        ctx.beginPath();


        ctx.roundRect(
            -half,
            -half,
            size,
            size,
            Math.min(
                9,
                size * .12
            )
        );


        ctx.fill();


        /*
         * Level indicator.
         */

        if (
            building.level > 1
        ) {

            ctx.fillStyle =
                "rgba(255,255,255,.88)";


            ctx.font =
                `bold ${Math.max(
                    9,
                    size * .12
                )}px Arial`;


            ctx.textAlign =
                "center";


            ctx.textBaseline =
                "middle";


            ctx.fillText(
                "LV " +
                building.level,
                0,
                half - 9
            );

        }


        /*
         * Icon.
         */

        const iconSize =
            Math.max(
                16,
                size * .34
            );


        ctx.font =
            `${iconSize}px Arial`;


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.fillStyle =
            "white";


        ctx.fillText(
            data.icon || "🏢",
            0,
            0
        );


        /*
         * Building outline.
         */

        ctx.strokeStyle =
            "rgba(255,255,255,.18)";


        ctx.lineWidth =
            1.5;


        ctx.beginPath();


        ctx.roundRect(
            -half,
            -half,
            size,
            size,
            Math.min(
                9,
                size * .12
            )
        );


        ctx.stroke();


        /*
         * Building label.
         */

        if (
            this.showLabels &&
            this.camera.zoom >= 0.85
        ) {

            this.drawBuildingLabel(
                building,
                data,
                size
            );

        }


        ctx.restore();

    }


    /* ========================================================
       BUILDING LABEL
    ======================================================== */

    drawBuildingLabel(
        building,
        data,
        size
    ) {

        const ctx =
            this.ctx;


        const name =
            data.name ||
            building.type;


        ctx.font =
            "600 10px Arial";


        const textWidth =
            ctx.measureText(
                name
            ).width;


        const padding =
            6;


        const width =
            textWidth +
            padding * 2;


        const y =
            size / 2 +
            14;


        ctx.fillStyle =
            "rgba(8,12,16,.78)";


        ctx.beginPath();


        ctx.roundRect(
            -width / 2,
            y - 8,
            width,
            17,
            6
        );


        ctx.fill();


        ctx.fillStyle =
            "rgba(255,255,255,.88)";


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.fillText(
            name,
            0,
            y
        );

    }


    /* ========================================================
       SELECTION
    ======================================================== */

    drawSelection() {

        const building =
            this.buildingEngine?.selectedBuilding;


        if (!building)
            return;


        const ctx =
            this.ctx;


        const data =
            BuildingEngine.TYPES?.[
                building.type
            ];


        const size =
            Number(
                building.size ||
                data?.size ||
                40
            );


        const pulse =
            (
                Math.sin(
                    this.animationTime *
                    4
                ) +
                1
            ) /
            2;


        ctx.save();


        ctx.strokeStyle =
            `rgba(255,255,255,${
                .55 +
                pulse * .4
            })`;


        ctx.lineWidth =
            2.5 /
            Math.max(
                this.camera.zoom,
                .5
            );


        ctx.setLineDash([
            8,
            6
        ]);


        ctx.lineDashOffset =
            -this.animationTime *
            15;


        ctx.strokeRect(

            building.x -
            size / 2 -
            8,

            building.y -
            size / 2 -
            8,

            size + 16,

            size + 16

        );


        ctx.setLineDash([]);


        /*
         * Corner handles.
         */

        const cornerSize =
            5 /
            Math.max(
                this.camera.zoom,
                .5
            );


        ctx.fillStyle =
            "white";


        const corners = [

            [
                building.x -
                size / 2 -
                8,

                building.y -
                size / 2 -
                8
            ],

            [
                building.x +
                size / 2 +
                8,

                building.y -
                size / 2 -
                8
            ],

            [
                building.x -
                size / 2 -
                8,

                building.y +
                size / 2 +
                8
            ],

            [
                building.x +
                size / 2 +
                8,

                building.y +
                size / 2 +
                8
            ]

        ];


        for (
            const [
                x,
                y
            ]
            of corners
        ) {

            ctx.fillRect(
                x -
                cornerSize / 2,

                y -
                cornerSize / 2,

                cornerSize,

                cornerSize
            );

        }


        ctx.restore();

    }


    /* ========================================================
       BUILDING PREVIEW
    ======================================================== */

    drawBuildingPreview() {

        if (
            !this.buildingEngine
        ) {

            return;

        }


        if (
            typeof this.buildingEngine
                .drawPreview ===
            "function"
        ) {

            this.buildingEngine.drawPreview(
                this.ctx
            );

            return;

        }


        const tool =
            this.city.currentTool;


        if (
            !tool ||
            tool === "road"
        ) {

            return;

        }


        const data =
            BuildingEngine.TYPES?.[
                tool
            ];


        const point =
            this.buildingEngine
                .previewPoint;


        if (
            !data ||
            !point
        ) {

            return;

        }


        const x =
            Math.round(
                point.x / 10
            ) * 10;


        const y =
            Math.round(
                point.y / 10
            ) * 10;


        const size =
            data.size;


        const valid =
            !this.buildingEngine.isOccupied(
                x,
                y,
                size
            );


        const ctx =
            this.ctx;


        ctx.save();


        ctx.globalAlpha =
            .55;


        ctx.fillStyle =
            valid
                ? data.color
                : "#9a4f4f";


        ctx.fillRect(
            x - size / 2,
            y - size / 2,
            size,
            size
        );


        ctx.strokeStyle =
            valid
                ? "rgba(255,255,255,.8)"
                : "rgba(255,90,90,.9)";


        ctx.lineWidth =
            2;


        ctx.setLineDash([
            7,
            5
        ]);


        ctx.strokeRect(
            x - size / 2,
            y - size / 2,
            size,
            size
        );


        ctx.setLineDash([]);


        ctx.font =
            `${Math.max(
                18,
                size * .3
            )}px Arial`;


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.fillStyle =
            "white";


        ctx.fillText(
            data.icon || "🏢",
            x,
            y
        );


        ctx.restore();

    }


    /* ========================================================
       ROAD PREVIEW
    ======================================================== */

    drawRoadPreview() {

        if (
            !this.roadEngine
        ) {

            return;

        }


        if (
            typeof this.roadEngine
                .drawPreview ===
            "function"
        ) {

            this.roadEngine.drawPreview(
                this.ctx
            );

        }

    }


    /* ========================================================
       WORLD -> SCREEN
    ======================================================== */

    worldToScreen(
        x,
        y
    ) {

        return {

            x:
                this.width / 2 +
                this.camera.x +
                x *
                this.camera.zoom,

            y:
                this.height / 2 +
                this.camera.y +
                y *
                this.camera.zoom

        };

    }


    /* ========================================================
       SCREEN -> WORLD
    ======================================================== */

    screenToWorld(
        x,
        y
    ) {

        const rect =
            this.canvas
                .getBoundingClientRect();


        const screenX =
            x -
            rect.left;


        const screenY =
            y -
            rect.top;


        return {

            x:
                (
                    screenX -
                    this.width / 2 -
                    this.camera.x
                ) /
                this.camera.zoom,

            y:
                (
                    screenY -
                    this.height / 2 -
                    this.camera.y
                ) /
                this.camera.zoom

        };

    }


    /* ========================================================
       VISIBILITY CHECK
    ======================================================== */

    isVisible(
        x,
        y,
        size = 50
    ) {

        const point =
            this.worldToScreen(
                x,
                y
            );


        const margin =
            size *
            this.camera.zoom;


        return (

            point.x >
                -margin &&

            point.x <
                this.width +
                margin &&

            point.y >
                -margin &&

            point.y <
                this.height +
                margin

        );

    }


    /* ========================================================
       TOGGLE GRID
    ======================================================== */

    toggleGrid(
        value
    ) {

        if (
            typeof value ===
            "boolean"
        ) {

            this.showGrid =
                value;

        } else {

            this.showGrid =
                !this.showGrid;

        }


        return this.showGrid;

    }


    /* ========================================================
       TOGGLE LABELS
    ======================================================== */

    toggleLabels(
        value
    ) {

        if (
            typeof value ===
            "boolean"
        ) {

            this.showLabels =
                value;

        } else {

            this.showLabels =
                !this.showLabels;

        }


        return this.showLabels;

    }


    /* ========================================================
       TOGGLE SHADOWS
    ======================================================== */

    toggleShadows(
        value
    ) {

        if (
            typeof value ===
            "boolean"
        ) {

            this.showShadows =
                value;

        } else {

            this.showShadows =
                !this.showShadows;

        }


        return this.showShadows;

    }


    /* ========================================================
       SET ENGINES
    ======================================================== */

    setEngines(
        roadEngine,
        buildingEngine
    ) {

        this.roadEngine =
            roadEngine ||
            null;


        this.buildingEngine =
            buildingEngine ||
            null;

    }


    /* ========================================================
       SET SIZE
    ======================================================== */

    setSize(
        width,
        height
    ) {

        this.width =
            Number(width) ||
            window.innerWidth;


        this.height =
            Number(height) ||
            window.innerHeight;

    }


    /* ========================================================
       DESTROY
    ======================================================== */

    destroy() {

        this.roadEngine =
            null;

        this.buildingEngine =
            null;

        this.city =
            null;

        this.canvas =
            null;

        this.ctx =
            null;

    }

}
