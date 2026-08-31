/* ============================================================
   MetroCity V5 — CityRenderer
   Professional city rendering system
   Terrain • Grid • Roads • Buildings • Trees • Water
============================================================ */

export class CityRenderer {

    constructor(
        canvas,
        city,
        camera,
        roadEngine,
        buildingEngine
    ) {

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.city = city;
        this.camera = camera;

        this.roadEngine = roadEngine;
        this.buildingEngine = buildingEngine;

        this.dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        this.width = 0;
        this.height = 0;

        this.resize();

        window.addEventListener(
            "resize",
            () => this.resize()
        );

        this.start();
    }


    /* ========================================================
       RESIZE
    ======================================================== */

    resize() {

        const rect =
            this.canvas.getBoundingClientRect();

        this.width =
            Math.max(1, rect.width);

        this.height =
            Math.max(1, rect.height);

        this.canvas.width =
            Math.round(
                this.width * this.dpr
            );

        this.canvas.height =
            Math.round(
                this.height * this.dpr
            );

        this.ctx.setTransform(
            this.dpr,
            0,
            0,
            this.dpr,
            0,
            0
        );

        if (
            this.camera &&
            this.camera.resize
        ) {

            this.camera.resize();
        }
    }


    /* ========================================================
       MAIN LOOP
    ======================================================== */

    start() {

        const loop = () => {

            this.render();

            requestAnimationFrame(
                loop
            );
        };

        requestAnimationFrame(loop);
    }


    /* ========================================================
       RENDER
    ======================================================== */

    render() {

        const ctx = this.ctx;

        ctx.setTransform(
            this.dpr,
            0,
            0,
            this.dpr,
            0,
            0
        );

        ctx.clearRect(
            0,
            0,
            this.width,
            this.height
        );


        /*
         * Background
         */

        this.drawBackground(
            ctx
        );


        /*
         * Camera world
         */

        ctx.save();

        this.camera.apply(
            ctx
        );


        /*
         * World layers
         */

        this.drawTerrain(
            ctx
        );

        this.drawWater(
            ctx
        );

        this.drawGrid(
            ctx
        );

        this.drawRoads(
            ctx
        );

        this.drawBuildings(
            ctx
        );

        this.drawTrees(
            ctx
        );

        this.drawIntersections(
            ctx
        );


        /*
         * Active previews
         */

        if (
            this.roadEngine &&
            this.roadEngine.drawPreview
        ) {

            this.roadEngine.drawPreview(
                ctx
            );
        }


        if (
            this.buildingEngine &&
            this.buildingEngine.drawPreview
        ) {

            this.buildingEngine.drawPreview(
                ctx
            );
        }


        ctx.restore();
    }


    /* ========================================================
       BACKGROUND
    ======================================================== */

    drawBackground(ctx) {

        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                0,
                this.height
            );

        gradient.addColorStop(
            0,
            "#10161d"
        );

        gradient.addColorStop(
            1,
            "#080c10"
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
       TERRAIN
    ======================================================== */

    drawTerrain(ctx) {

        const size =
            this.camera.worldWidth ||
            5000;


        const half =
            size / 2;


        ctx.fillStyle =
            "#263d2d";


        ctx.fillRect(
            -half,
            -half,
            size,
            size
        );


        /*
         * Soft terrain patches.
         */

        const patches = [
            [-1200, -800, 650],
            [900, -950, 700],
            [-1000, 850, 800],
            [1050, 850, 600],
            [0, 0, 900]
        ];


        for (
            const patch
            of patches
        ) {

            const x =
                patch[0];

            const y =
                patch[1];

            const radius =
                patch[2];


            const gradient =
                ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    radius
                );


            gradient.addColorStop(
                0,
                "rgba(88,125,75,.16)"
            );

            gradient.addColorStop(
                1,
                "rgba(88,125,75,0)"
            );


            ctx.fillStyle =
                gradient;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }


    /* ========================================================
       WATER
    ======================================================== */

    drawWater(ctx) {

        const waterAreas = [

            {
                x: -1800,
                y: -100,
                width: 550,
                height: 3000
            },

            {
                x: -800,
                y: 1250,
                width: 2500,
                height: 420
            }

        ];


        for (
            const water
            of waterAreas
        ) {

            ctx.fillStyle =
                "#28566d";


            ctx.fillRect(
                water.x,
                water.y,
                water.width,
                water.height
            );


            /*
             * Water highlights.
             */

            ctx.save();

            ctx.globalAlpha =
                0.22;

            ctx.strokeStyle =
                "#8ec5d8";

            ctx.lineWidth = 2;


            const spacing = 42;


            for (
                let y =
                    water.y + 20;

                y <
                    water.y +
                    water.height;

                y += spacing
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    water.x + 20,
                    y
                );

                ctx.lineTo(
                    water.x +
                        water.width -
                        20,
                    y
                );

                ctx.stroke();
            }


            ctx.restore();
        }
    }


    /* ========================================================
       GRID
    ======================================================== */

    drawGrid(ctx) {

        const zoom =
            this.camera.zoom;


        /*
         * Hide detailed grid when zoomed out.
         */

        if (
            zoom < 0.45
        ) {

            return;
        }


        const gridSize =
            zoom < 0.75
                ? 100
                : 50;


        const worldSize =
            this.camera.worldWidth ||
            5000;


        const half =
            worldSize / 2;


        ctx.save();

        ctx.lineWidth =
            1 / zoom;

        ctx.strokeStyle =
            "rgba(255,255,255,.055)";


        ctx.beginPath();


        for (
            let x = -half;
            x <= half;
            x += gridSize
        ) {

            ctx.moveTo(
                x,
                -half
            );

            ctx.lineTo(
                x,
                half
            );
        }


        for (
            let y = -half;
            y <= half;
            y += gridSize
        ) {

            ctx.moveTo(
                -half,
                y
            );

            ctx.lineTo(
                half,
                y
            );
        }


        ctx.stroke();

        ctx.restore();
    }


    /* ========================================================
       ROADS
    ======================================================== */

    drawRoads(ctx) {

        const roads =
            this.city.roads || [];


        for (
            const road
            of roads
        ) {

            this.drawRoad(
                ctx,
                road
            );
        }
    }


    drawRoad(
        ctx,
        road
    ) {

        const width =
            road.width || 28;


        /*
         * Road shadow.
         */

        ctx.save();

        ctx.lineCap =
            "round";


        ctx.strokeStyle =
            "rgba(0,0,0,.42)";

        ctx.lineWidth =
            width + 10;


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
         * Road base.
         */

        ctx.strokeStyle =
            "#515b63";

        ctx.lineWidth =
            width;


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
         * Road edge.
         */

        ctx.strokeStyle =
            "#69747d";

        ctx.lineWidth =
            2;


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
         * Center markings.
         */

        ctx.strokeStyle =
            "rgba(245,211,96,.8)";

        ctx.lineWidth =
            2 /
            Math.max(
                0.5,
                this.camera.zoom
            );


        ctx.setLineDash([
            12,
            10
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


        ctx.restore();
    }


    /* ========================================================
       BUILDINGS
    ======================================================== */

    drawBuildings(ctx) {

        const buildings =
            this.city.buildings || [];


        /*
         * Back-to-front sorting.
         */

        const sorted =
            [...buildings]
                .sort(
                    (a, b) =>
                        a.y - b.y
                );


        for (
            const building
            of sorted
        ) {

            this.drawBuilding(
                ctx,
                building
            );
        }
    }


    drawBuilding(
        ctx,
        building
    ) {

        const type =
            this.buildingEngine?.constructor?.TYPES?.[
                building.type
            ];


        if (!type) {
            return;
        }


        const size =
            building.size ||
            type.size ||
            64;


        const x =
            building.x;


        const y =
            building.y;


        const height =
            10 +
            (
                building.level || 1
            ) *
            6;


        /*
         * Building shadow.
         */

        ctx.save();


        ctx.fillStyle =
            "rgba(0,0,0,.38)";


        ctx.fillRect(
            x -
                size / 2 +
                height * .55,

            y -
                size / 2 +
                height * .75,

            size,

            size
        );


        /*
         * Main building.
         */

        ctx.fillStyle =
            type.color ||
            "#78838c";


        ctx.fillRect(
            x -
                size / 2,

            y -
                size / 2,

            size,

            size
        );


        /*
         * Roof.
         */

        ctx.fillStyle =
            "rgba(255,255,255,.12)";


        ctx.fillRect(
            x -
                size / 2,

            y -
                size / 2,

            size,

            7
        );


        /*
         * Windows.
         */

        this.drawWindows(
            ctx,
            building,
            size
        );


        /*
         * Building icon.
         */

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        const iconSize =
            Math.max(
                18,
                Math.min(
                    34,
                    size * .34
                )
            );


        ctx.font =
            `${iconSize}px Arial`;


        ctx.fillStyle =
            "white";


        ctx.fillText(
            type.icon || "🏢",
            x,
            y
        );


        /*
         * Level badge.
         */

        if (
            building.level > 1
        ) {

            this.drawLevelBadge(
                ctx,
                building,
                size
            );
        }


        /*
         * Selected outline.
         */

        if (
            this.buildingEngine &&
            this.buildingEngine.selectedBuilding ===
                building
        ) {

            ctx.strokeStyle =
                "#ffffff";

            ctx.lineWidth =
                3 /
                Math.max(
                    0.5,
                    this.camera.zoom
                );


            ctx.strokeRect(
                x -
                    size / 2 -
                    5,

                y -
                    size / 2 -
                    5,

                size + 10,

                size + 10
            );
        }


        ctx.restore();
    }


    /* ========================================================
       WINDOWS
    ======================================================== */

    drawWindows(
        ctx,
        building,
        size
    ) {

        if (
            size < 50
        ) {

            return;
        }


        const rows =
            Math.max(
                2,
                Math.min(
                    5,
                    Math.floor(
                        size / 20
                    )
                )
            );


        const columns =
            Math.max(
                2,
                Math.min(
                    5,
                    Math.floor(
                        size / 20
                    )
                )
            );


        const windowSize =
            Math.max(
                3,
                size * .055
            );


        ctx.fillStyle =
            "rgba(220,235,220,.42)";


        for (
            let row = 0;
            row < rows;
            row++
        ) {

            for (
                let column = 0;
                column < columns;
                column++
            ) {

                /*
                 * Keep center area clear
                 * for building icon.
                 */

                const px =
                    building.x -
                    size / 2 +
                    13 +
                    column *
                    (
                        (
                            size - 26
                        ) /
                        Math.max(
                            1,
                            columns - 1
                        )
                    );


                const py =
                    building.y -
                    size / 2 +
                    15 +
                    row *
                    (
                        (
                            size - 30
                        ) /
                        Math.max(
                            1,
                            rows - 1
                        )
                    );


                ctx.fillRect(
                    px -
                        windowSize / 2,

                    py -
                        windowSize / 2,

                    windowSize,

                    windowSize
                );
            }
        }
    }


    /* ========================================================
       LEVEL BADGE
    ======================================================== */

    drawLevelBadge(
        ctx,
        building,
        size
    ) {

        const text =
            `Lv.${building.level}`;


        const badgeX =
            building.x +
            size / 2 -
            3;


        const badgeY =
            building.y -
            size / 2 -
            3;


        ctx.font =
            "bold 9px Arial";


        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        const width =
            ctx.measureText(
                text
            ).width +
            10;


        ctx.fillStyle =
            "rgba(10,14,18,.9)";


        ctx.beginPath();

        ctx.roundRect(
            badgeX -
                width / 2,

            badgeY -
                9,

            width,

            18,

            5
        );

        ctx.fill();


        ctx.fillStyle =
            "#ffffff";


        ctx.fillText(
            text,
            badgeX,
            badgeY
        );
    }


    /* ========================================================
       TREES
    ======================================================== */

    drawTrees(ctx) {

        /*
         * Deterministic decorative trees.
         * They don't occupy build slots.
         */

        const trees = [

            [-1420, -1180],
            [-1330, -1110],
            [-1230, -1210],
            [1330, -1120],
            [1410, -1050],
            [1270, -980],

            [-1380, 1180],
            [-1290, 1260],
            [-1160, 1170],

            [1260, 1170],
            [1380, 1250],
            [1480, 1160],

            [-500, -1350],
            [-380, -1400],
            [520, -1370],
            [640, -1310]

        ];


        for (
            const tree
            of trees
        ) {

            this.drawTree(
                ctx,
                tree[0],
                tree[1]
            );
        }
    }


    drawTree(
        ctx,
        x,
        y
    ) {

        const scale =
            0.8 +
            (
                (
                    Math.abs(
                        Math.sin(
                            x * 12.9898 +
                            y * 78.233
                        )
                    )
                ) *
                .5
            );


        /*
         * Shadow.
         */

        ctx.fillStyle =
            "rgba(0,0,0,.25)";


        ctx.beginPath();

        ctx.ellipse(
            x + 5,
            y + 9,
            13 * scale,
            6 * scale,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         * Trunk.
         */

        ctx.fillStyle =
            "#694b35";


        ctx.fillRect(
            x - 3,
            y,
            6,
            15
        );


        /*
         * Crown.
         */

        ctx.fillStyle =
            "#3d6e48";


        ctx.beginPath();

        ctx.arc(
            x,
            y - 5,
            16 * scale,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle =
            "#54835a";


        ctx.beginPath();

        ctx.arc(
            x - 6,
            y - 10,
            8 * scale,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    /* ========================================================
       INTERSECTIONS
    ======================================================== */

    drawIntersections(ctx) {

        const intersections =
            this.city.intersections || [];


        if (
            intersections.length === 0
        ) {

            return;
        }


        for (
            const point
            of intersections
        ) {

            ctx.fillStyle =
                "#444c52";


            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                15,
                0,
                Math.PI * 2
            );

            ctx.fill();


            /*
             * Traffic light indicator.
             */

            ctx.fillStyle =
                "#71b97b";


            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }


    /* ========================================================
       WORLD TO SCREEN
    ======================================================== */

    worldToScreen(
        x,
        y
    ) {

        return this.camera.worldToScreen(
            x,
            y
        );
    }


    /* ========================================================
       DESTROY
    ======================================================== */

    destroy() {

        /*
         * Rendering loop intentionally
         * continues with GC-safe references.
         */

        this.canvas =
            null;

        this.ctx =
            null;
    }

}
