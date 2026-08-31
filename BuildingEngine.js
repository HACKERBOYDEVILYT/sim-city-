/* ============================================================
   MetroCity V5 — BuildingEngine
   Building placement + upgrade + demolish + simulation
============================================================ */

export class BuildingEngine {

    static TYPES = {

        house: {
            name: "Residential",
            icon: "🏠",
            color: "#7b9cc7",
            cost: 100,
            population: 20,
            workers: 0,
            happiness: 2,
            service: 0,
            size: 64
        },

        commercial: {
            name: "Commercial",
            icon: "🏢",
            color: "#c49a65",
            cost: 250,
            population: 8,
            workers: 18,
            happiness: 3,
            service: 0,
            size: 72
        },

        industrial: {
            name: "Industrial",
            icon: "🏭",
            color: "#7e858c",
            cost: 350,
            population: 5,
            workers: 28,
            happiness: -2,
            service: 0,
            size: 76
        },

        hospital: {
            name: "Hospital",
            icon: "🏥",
            color: "#c86d72",
            cost: 5000,
            population: 0,
            workers: 45,
            happiness: 10,
            service: 100,
            size: 90
        },

        police: {
            name: "Police Station",
            icon: "🚓",
            color: "#647fa8",
            cost: 3500,
            population: 0,
            workers: 25,
            happiness: 7,
            service: 80,
            size: 82
        },

        fire: {
            name: "Fire Station",
            icon: "🚒",
            color: "#b85f50",
            cost: 3000,
            population: 0,
            workers: 25,
            happiness: 6,
            service: 80,
            size: 82
        },

        school: {
            name: "School",
            icon: "🏫",
            color: "#b3a269",
            cost: 4000,
            population: 0,
            workers: 30,
            happiness: 8,
            service: 90,
            size: 88
        },

        park: {
            name: "Park",
            icon: "🌳",
            color: "#63875f",
            cost: 500,
            population: 0,
            workers: 2,
            happiness: 12,
            service: 50,
            size: 82
        },

        power: {
            name: "Power Plant",
            icon: "⚡",
            color: "#9a8b56",
            cost: 2000,
            population: 0,
            workers: 15,
            happiness: -1,
            service: 120,
            size: 86
        },

        water: {
            name: "Water Plant",
            icon: "💧",
            color: "#5289a8",
            cost: 1500,
            population: 0,
            workers: 12,
            happiness: 2,
            service: 120,
            size: 86
        },

        stadium: {
            name: "Stadium",
            icon: "🏟️",
            color: "#786c9b",
            cost: 12000,
            population: 0,
            workers: 65,
            happiness: 15,
            service: 150,
            size: 120
        }

    };


    constructor(
        city,
        camera,
        canvas
    ) {

        this.city = city;

        this.camera = camera;

        this.canvas = canvas;

        this.selectedBuilding = null;

        this.previewPoint = null;

        this.pointerId = null;

        this.bindEvents();

        this.startSimulation();
    }


    /* ========================================================
       EVENTS
    ======================================================== */

    bindEvents() {

        this.canvas.addEventListener(
            "pointermove",
            event => {

                if (
                    this.city.currentTool &&
                    this.city.currentTool !== "road"
                ) {

                    this.previewPoint =
                        this.screenToWorld(
                            event.clientX,
                            event.clientY
                        );

                }

            }
        );


        this.canvas.addEventListener(
            "pointerdown",
            event => {

                if (
                    this.city.currentTool === "road"
                ) {
                    return;
                }


                if (
                    !this.city.currentTool
                ) {
                    return;
                }


                const type =
                    this.city.currentTool;


                if (
                    !BuildingEngine.TYPES[type]
                ) {
                    return;
                }


                const point =
                    this.screenToWorld(
                        event.clientX,
                        event.clientY
                    );


                this.placeBuilding(
                    type,
                    point.x,
                    point.y
                );

            }
        );
    }


    /* ========================================================
       PLACE BUILDING
    ======================================================== */

    placeBuilding(
        type,
        x,
        y
    ) {

        const data =
            BuildingEngine.TYPES[type];


        if (!data) {
            return false;
        }


        /*
         * Check money.
         */

        if (
            this.city.money <
            data.cost
        ) {

            this.notify(
                "Not Enough Money",
                `${data.name} costs $${data.cost.toLocaleString()}.`
            );

            return false;
        }


        /*
         * Snap building to grid.
         */

        x =
            Math.round(
                x / 10
            ) * 10;


        y =
            Math.round(
                y / 10
            ) * 10;


        /*
         * Prevent overlapping buildings.
         */

        if (
            this.isOccupied(
                x,
                y,
                data.size
            )
        ) {

            this.notify(
                "Cannot Build Here",
                "This location is already occupied."
            );

            return false;
        }


        /*
         * Require nearby road.
         */

        if (
            type !== "park" &&
            type !== "power" &&
            type !== "water" &&
            !this.hasNearbyRoad(
                x,
                y,
                230
            )
        ) {

            this.notify(
                "No Road Access",
                "Build a road near this location first."
            );

            return false;
        }


        /*
         * Create building.
         */

        const building = {

            id:
                "building_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2, 8),

            type,

            x,

            y,

            size:
                data.size,

            level: 1,

            population:
                data.population,

            workers:
                data.workers,

            happiness:
                data.happiness,

            service:
                data.service,

            createdAt:
                Date.now()

        };


        /*
         * Pay.
         */

        this.city.money -=
            data.cost;


        /*
         * Add building.
         */

        this.city.buildings.push(
            building
        );


        /*
         * Recalculate city.
         */

        this.recalculateCity();


        /*
         * Notification.
         */

        this.notify(
            "Building Constructed",
            `${data.name} has been added to your city.`
        );


        window.dispatchEvent(
            new CustomEvent(
                "metrocity:buildingCreated",
                {
                    detail: building
                }
            )
        );


        return true;
    }


    /* ========================================================
       OCCUPIED CHECK
    ======================================================== */

    isOccupied(
        x,
        y,
        size
    ) {

        const padding = 12;


        for (
            const building
            of this.city.buildings
        ) {

            const distance =
                Math.hypot(
                    building.x - x,
                    building.y - y
                );


            const minimum =
                (
                    building.size +
                    size
                ) / 2 +
                padding;


            if (
                distance <
                minimum
            ) {

                return true;
            }

        }


        return false;
    }


    /* ========================================================
       ROAD ACCESS
    ======================================================== */

    hasNearbyRoad(
        x,
        y,
        maxDistance
    ) {

        for (
            const road
            of this.city.roads
        ) {

            const distance =
                this.distanceToSegment(
                    x,
                    y,
                    road.x1,
                    road.y1,
                    road.x2,
                    road.y2
                );


            if (
                distance <=
                maxDistance
            ) {

                return true;
            }

        }


        return false;
    }


    /* ========================================================
       FIND BUILDING
    ======================================================== */

    findBuildingAt(
        x,
        y
    ) {

        for (
            let i =
                this.city.buildings.length -
                1;

            i >= 0;

            i--
        ) {

            const building =
                this.city.buildings[i];


            const half =
                building.size / 2;


            if (

                x >=
                    building.x - half &&

                x <=
                    building.x + half &&

                y >=
                    building.y - half &&

                y <=
                    building.y + half

            ) {

                return building;
            }

        }


        return null;
    }


    /* ========================================================
       SELECT
    ======================================================== */

    selectBuilding(
        building
    ) {

        this.selectedBuilding =
            building;

    }


    /* ========================================================
       UPGRADE
    ======================================================== */

    upgradeBuilding(
        building
    ) {

        if (!building) {
            return false;
        }


        const data =
            BuildingEngine.TYPES[
                building.type
            ];


        if (!data) {
            return false;
        }


        const maxLevel = 5;


        if (
            building.level >=
            maxLevel
        ) {

            this.notify(
                "Maximum Level",
                "This building has reached level 5."
            );

            return false;
        }


        const upgradeCost =
            Math.round(
                data.cost *
                (
                    0.65 +
                    building.level *
                    0.55
                )
            );


        if (
            this.city.money <
            upgradeCost
        ) {

            this.notify(
                "Not Enough Money",
                `Upgrade costs $${upgradeCost.toLocaleString()}.`
            );

            return false;
        }


        this.city.money -=
            upgradeCost;


        building.level +=
            1;


        /*
         * Increase building stats.
         */

        const multiplier =
            1 +
            (
                (
                    building.level -
                    1
                ) *
                0.35
            );


        building.population =
            Math.round(
                data.population *
                multiplier
            );


        building.workers =
            Math.round(
                data.workers *
                multiplier
            );


        building.happiness =
            Math.round(
                data.happiness *
                multiplier
            );


        building.service =
            Math.round(
                data.service *
                multiplier
            );


        building.size =
            Math.min(
                data.size *
                (
                    1 +
                    (
                        building.level -
                        1
                    ) *
                    0.06
                ),

                data.size * 1.3
            );


        this.recalculateCity();


        this.notify(
            "Building Upgraded",
            `${data.name} is now level ${building.level}.`
        );


        window.dispatchEvent(
            new CustomEvent(
                "metrocity:buildingUpgraded",
                {
                    detail: building
                }
            )
        );


        return true;
    }


    /* ========================================================
       DEMOLISH
    ======================================================== */

    demolishBuilding(
        building
    ) {

        if (!building) {
            return false;
        }


        const index =
            this.city.buildings.indexOf(
                building
            );


        if (
            index === -1
        ) {

            return false;
        }


        const data =
            BuildingEngine.TYPES[
                building.type
            ];


        /*
         * Refund part of construction
         * cost.
         */

        const refund =
            Math.round(
                (
                    data?.cost || 0
                ) *
                0.35
            );


        this.city.money +=
            refund;


        this.city.buildings.splice(
            index,
            1
        );


        if (
            this.selectedBuilding ===
            building
        ) {

            this.selectedBuilding =
                null;

        }


        this.recalculateCity();


        this.notify(
            "Building Demolished",
            `You received $${refund.toLocaleString()} refund.`
        );


        window.dispatchEvent(
            new CustomEvent(
                "metrocity:buildingDemolished",
                {
                    detail: building
                }
            )
        );


        return true;
    }


    /* ========================================================
       SERVICE COVERAGE
    ======================================================== */

    getServiceCoverage(
        building
    ) {

        if (!building) {
            return 0;
        }


        let coverage = 0;


        for (
            const other
            of this.city.buildings
        ) {

            const data =
                BuildingEngine.TYPES[
                    other.type
                ];


            if (
                !data ||
                data.service <= 0
            ) {
                continue;
            }


            const distance =
                Math.hypot(
                    other.x -
                        building.x,

                    other.y -
                        building.y
                );


            const radius =
                220 *
                Math.max(
                    1,
                    other.level
                );


            if (
                distance <=
                radius
            ) {

                const factor =
                    1 -
                    (
                        distance /
                        radius
                    );


                coverage +=
                    data.service *
                    factor;

            }

        }


        return Math.round(
            coverage
        );
    }


    /* ========================================================
       CITY RECALCULATION
    ======================================================== */

    recalculateCity() {

        let population = 0;

        let workers = 0;

        let happiness = 70;

        let powerSupply = 0;

        let powerDemand = 0;


        for (
            const building
            of this.city.buildings
        ) {

            const data =
                BuildingEngine.TYPES[
                    building.type
                ];


            if (!data) {
                continue;
            }


            population +=
                building.population ||
                0;


            workers +=
                building.workers ||
                0;


            happiness +=
                building.happiness ||
                0;


            if (
                building.type ===
                "power"
            ) {

                powerSupply +=
                    building.service ||
                    0;

            }


            if (
                building.type !==
                "power"
            ) {

                powerDemand +=
                    Math.max(
                        1,
                        (
                            building.population ||
                            0
                        ) * 0.04
                    );

            }

        }


        /*
         * Roads improve city
         * accessibility.
         */

        const roadBonus =
            Math.min(
                12,
                this.city.roads.length *
                0.8
            );


        happiness +=
            roadBonus;


        /*
         * Parks and services.
         */

        const parkCount =
            this.city.buildings.filter(
                building =>
                    building.type ===
                    "park"
            ).length;


        happiness +=
            Math.min(
                10,
                parkCount * 1.5
            );


        /*
         * Power calculation.
         */

        if (
            powerDemand <= 0
        ) {

            this.city.power =
                100;

        } else {

            this.city.power =
                Math.min(
                    100,

                    (
                        powerSupply /
                        powerDemand
                    ) *
                    100
                );

        }


        /*
         * Power shortage reduces happiness.
         */

        if (
            this.city.power <
            100
        ) {

            happiness -=
                (
                    100 -
                    this.city.power
                ) *
                0.12;

        }


        this.city.population =
            Math.max(
                0,
                Math.round(
                    population
                )
            );


        this.city.happiness =
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        happiness
                    )
                )
            );


        /*
         * Store workforce for future
         * simulation systems.
         */

        this.city.workers =
            workers;


        /*
         * Dispatch update.
         */

        window.dispatchEvent(
            new CustomEvent(
                "metrocity:cityUpdated"
            )
        );
    }


    /* ========================================================
       SIMULATION
    ======================================================== */

    startSimulation() {

        setInterval(
            () => {

                this.simulate();

            },

            5000
        );
    }


    simulate() {

        if (
            this.city.buildings.length === 0
        ) {

            return;
        }


        const speed =
            Number(
                window.metroCitySpeed ||
                1
            );


        /*
         * Tax income.
         */

        let income = 0;


        for (
            const building
            of this.city.buildings
        ) {

            const data =
                BuildingEngine.TYPES[
                    building.type
                ];


            if (!data) {
                continue;
            }


            income +=
                (
                    building.population *
                    0.12
                );


            income +=
                (
                    building.workers *
                    0.05
                );

        }


        income *=
            speed;


        /*
         * Happiness affects income.
         */

        income *=
            (
                0.65 +
                (
                    this.city.happiness /
                    100
                ) *
                0.35
            );


        this.city.money +=
            income;


        /*
         * Small population growth.
         */

        if (
            this.city.happiness >=
            60
        ) {

            const growth =
                Math.max(
                    1,
                    Math.round(
                        this.city.population *
                        0.001 *
                        speed
                    )
                );


            /*
             * Growth is intentionally
             * limited.
             */

            if (
                growth > 0
            ) {

                this.city.population +=
                    growth;

            }

        }


        this.recalculateCity();


        window.dispatchEvent(
            new CustomEvent(
                "metrocity:simulationTick",
                {
                    detail: {
                        income
                    }
                }
            )
        );
    }


    /* ========================================================
       PREVIEW
    ======================================================== */

    drawPreview(ctx) {

        if (
            !this.city.currentTool ||
            this.city.currentTool === "road" ||
            !this.previewPoint
        ) {

            return;
        }


        const data =
            BuildingEngine.TYPES[
                this.city.currentTool
            ];


        if (!data) {
            return;
        }


        let x =
            Math.round(
                this.previewPoint.x /
                10
            ) * 10;


        let y =
            Math.round(
                this.previewPoint.y /
                10
            ) * 10;


        const valid =
            !this.isOccupied(
                x,
                y,
                data.size
            );


        ctx.save();


        ctx.globalAlpha =
            0.65;


        /*
         * Preview shadow.
         */

        ctx.fillStyle =
            "rgba(0,0,0,.25)";


        ctx.fillRect(

            x -
                data.size / 2 +
                6,

            y -
                data.size / 2 +
                6,

            data.size,

            data.size

        );


        /*
         * Preview body.
         */

        ctx.fillStyle =
            valid
                ? data.color
                : "#9a4f4f";


        ctx.fillRect(

            x -
                data.size / 2,

            y -
                data.size / 2,

            data.size,

            data.size

        );


        /*
         * Border.
         */

        ctx.strokeStyle =
            valid
                ? "rgba(255,255,255,.75)"
                : "rgba(255,100,100,.95)";


        ctx.lineWidth = 2;

        ctx.setLineDash([
            7,
            5
        ]);


        ctx.strokeRect(

            x -
                data.size / 2,

            y -
                data.size / 2,

            data.size,

            data.size

        );


        ctx.setLineDash([]);


        /*
         * Icon.
         */

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.font =
            `${Math.max(
                18,
                data.size * .32
            )}px Arial`;


        ctx.fillStyle =
            "white";


        ctx.fillText(
            data.icon,
            x,
            y
        );


        /*
         * Price.
         */

        ctx.font =
            "bold 11px Arial";


        const price =
            "$" +
            data.cost.toLocaleString();


        const metrics =
            ctx.measureText(
                price
            );


        ctx.fillStyle =
            "rgba(5,8,12,.85)";


        ctx.beginPath();

        ctx.roundRect(

            x -
                metrics.width / 2 -
                8,

            y +
                data.size / 2 +
                7,

            metrics.width +
                16,

            20,

            7

        );

        ctx.fill();


        ctx.fillStyle =
            "white";


        ctx.fillText(

            price,

            x,

            y +
                data.size / 2 +
                17

        );


        ctx.restore();
    }


    /* ========================================================
       SCREEN TO WORLD
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
       DISTANCE TO LINE
    ======================================================== */

    distanceToSegment(
        px,
        py,
        x1,
        y1,
        x2,
        y2
    ) {

        const dx =
            x2 - x1;


        const dy =
            y2 - y1;


        if (
            dx === 0 &&
            dy === 0
        ) {

            return Math.hypot(
                px - x1,
                py - y1
            );
        }


        const t =
            (
                (
                    px - x1
                ) *
                dx +

                (
                    py - y1
                ) *
                dy
            ) /
            (
                dx * dx +
                dy * dy
            );


        const clamped =
            Math.max(
                0,
                Math.min(
                    1,
                    t
                )
            );


        const closestX =
            x1 +
            clamped * dx;


        const closestY =
            y1 +
            clamped * dy;


        return Math.hypot(
            px - closestX,
            py - closestY
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
                        title,
                        text
                    }
                }
            )
        );
    }

}
