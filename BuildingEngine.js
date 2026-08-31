// MetroCity V5
// Building Engine V2
// Placement + Upgrade + Services + Population + Happiness

export class BuildingEngine {

    constructor(city, camera, canvas) {

        this.city = city;
        this.camera = camera;
        this.canvas = canvas;

        this.selectedBuilding = null;

        this.hoverPoint = null;

        this.previewBuilding = null;

        this.isPlacing = false;

        this.bindEvents();
    }


    // =========================================================
    // BUILDING DATABASE
    // =========================================================

    static TYPES = {

        house: {
            name: "Residential",
            icon: "🏠",

            cost: 100,

            size: 46,

            population: 12,

            workers: 0,

            happiness: 1,

            power: -1,

            water: -1,

            serviceRadius: 0,

            color: "#92715e"
        },


        commercial: {
            name: "Commercial",
            icon: "🏢",

            cost: 250,

            size: 52,

            population: 0,

            workers: 8,

            happiness: 2,

            power: -3,

            water: -2,

            serviceRadius: 0,

            color: "#5e7690"
        },


        industrial: {
            name: "Industrial",
            icon: "🏭",

            cost: 350,

            size: 58,

            population: 0,

            workers: 15,

            happiness: -2,

            power: -5,

            water: -3,

            serviceRadius: 0,

            color: "#817653"
        },


        hospital: {
            name: "Hospital",
            icon: "🏥",

            cost: 5000,

            size: 70,

            population: 0,

            workers: 25,

            happiness: 8,

            power: -8,

            water: -6,

            serviceRadius: 260,

            color: "#815e67"
        },


        police: {
            name: "Police Station",
            icon: "🚓",

            cost: 3500,

            size: 62,

            population: 0,

            workers: 12,

            happiness: 5,

            power: -4,

            water: -2,

            serviceRadius: 300,

            color: "#4f6582"
        },


        fire: {
            name: "Fire Station",
            icon: "🚒",

            cost: 3000,

            size: 62,

            population: 0,

            workers: 10,

            happiness: 4,

            power: -4,

            water: -4,

            serviceRadius: 280,

            color: "#8a514b"
        },


        school: {
            name: "School",
            icon: "🏫",

            cost: 4000,

            size: 66,

            population: 0,

            workers: 18,

            happiness: 6,

            power: -5,

            water: -3,

            serviceRadius: 240,

            color: "#76684e"
        },


        park: {
            name: "Park",
            icon: "🌳",

            cost: 500,

            size: 62,

            population: 0,

            workers: 0,

            happiness: 7,

            power: 0,

            water: -1,

            serviceRadius: 180,

            color: "#4c704d"
        },


        power: {
            name: "Power Plant",
            icon: "⚡",

            cost: 2000,

            size: 64,

            population: 0,

            workers: 8,

            happiness: -3,

            power: 80,

            water: -3,

            serviceRadius: 0,

            color: "#80634b"
        },


        water: {
            name: "Water Plant",
            icon: "💧",

            cost: 1500,

            size: 58,

            population: 0,

            workers: 6,

            happiness: -1,

            power: -4,

            water: 80,

            serviceRadius: 0,

            color: "#507d8c"
        },


        stadium: {
            name: "Stadium",
            icon: "🏟️",

            cost: 12000,

            size: 100,

            population: 0,

            workers: 20,

            happiness: 12,

            power: -10,

            water: -6,

            serviceRadius: 350,

            color: "#655978"
        }

    };


    // =========================================================
    // INPUT
    // =========================================================

    bindEvents() {

        this.canvas.addEventListener(
            "pointermove",
            event => {

                this.hoverPoint =
                    this.screenToWorld(
                        event.clientX,
                        event.clientY
                    );

            }
        );


        this.canvas.addEventListener(
            "pointerdown",
            event => {

                this.handlePointerDown(event);

            }
        );


        this.canvas.addEventListener(
            "pointerup",
            event => {

                this.handlePointerUp(event);

            }
        );


        this.canvas.addEventListener(
            "pointercancel",
            () => {

                this.cancelPlacement();

            }
        );
    }


    // =========================================================
    // POINTER DOWN
    // =========================================================

    handlePointerDown(event) {

        if (
            !this.city.currentTool ||
            this.city.currentTool === "road"
        ) {

            return;
        }


        const point =
            this.screenToWorld(
                event.clientX,
                event.clientY
            );


        this.isPlacing = true;

        this.hoverPoint = point;

        this.previewBuilding =
            this.createPreview(
                this.city.currentTool,
                point.x,
                point.y
            );
    }


    // =========================================================
    // POINTER UP
    // =========================================================

    handlePointerUp(event) {

        if (!this.isPlacing)
            return;


        const point =
            this.screenToWorld(
                event.clientX,
                event.clientY
            );


        const building =
            this.placeBuilding(
                this.city.currentTool,
                point.x,
                point.y
            );


        if (building) {

            this.selectedBuilding =
                building;

        }


        this.cancelPlacement();
    }


    // =========================================================
    // CREATE PREVIEW
    // =========================================================

    createPreview(
        type,
        x,
        y
    ) {

        const data =
            BuildingEngine.TYPES[type];


        if (!data)
            return null;


        return {

            type,

            x,

            y,

            size:
                data.size,

            valid:
                this.canPlace(
                    type,
                    x,
                    y
                )

        };
    }


    // =========================================================
    // PLACE BUILDING
    // =========================================================

    placeBuilding(
        type,
        x,
        y
    ) {

        const data =
            BuildingEngine.TYPES[type];


        if (!data) {

            this.notify(
                "Unknown Building",
                "This building type does not exist."
            );

            return null;
        }


        if (
            !this.canPlace(
                type,
                x,
                y
            )
        ) {

            this.notify(
                "Cannot Build Here",
                "The selected location is occupied or invalid."
            );

            return null;
        }


        if (
            this.city.money <
            data.cost
        ) {

            this.notify(
                "Not Enough Money",
                `You need $${data.cost.toLocaleString()}.`
            );

            return null;
        }


        const building = {

            id:
                this.generateId(
                    "building"
                ),

            type,

            x,

            y,

            size:
                data.size,

            level: 1,

            experience: 0,

            happiness:
                data.happiness,

            population:
                data.population,

            workers:
                data.workers,

            createdAt:
                Date.now()

        };


        this.city.buildings.push(
            building
        );


        this.city.money -=
            data.cost;


        this.applyBuildingEffects(
            building,
            true
        );


        this.notify(
            "Building Constructed",
            `${data.icon} ${data.name} built successfully.`
        );


        this.emit(
            "buildingCreated",
            building
        );


        return building;
    }


    // =========================================================
    // CAN PLACE
    // =========================================================

    canPlace(
        type,
        x,
        y
    ) {

        const data =
            BuildingEngine.TYPES[type];


        if (!data)
            return false;


        const half =
            data.size / 2;


        // World boundary

        const limit =
            1100;


        if (
            x - half < -limit ||
            x + half > limit ||
            y - half < -limit ||
            y + half > limit
        ) {

            return false;
        }


        // Building collision

        for (
            const building
            of this.city.buildings
        ) {

            const distance =
                this.distance(
                    {
                        x,
                        y
                    },
                    building
                );


            const minimum =
                half +
                building.size / 2 +
                12;


            if (
                distance <
                minimum
            ) {

                return false;
            }
        }


        return true;
    }


    // =========================================================
    // BUILDING UPGRADE
    // =========================================================

    upgradeBuilding(
        building
    ) {

        if (!building)
            return false;


        const data =
            BuildingEngine.TYPES[
                building.type
            ];


        if (!data)
            return false;


        const maxLevel = 5;


        if (
            building.level >=
            maxLevel
        ) {

            this.notify(
                "Maximum Level",
                "This building has reached maximum level."
            );

            return false;
        }


        const upgradeCost =
            Math.floor(
                data.cost *
                (
                    0.65 *
                    building.level
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


        this.removeBuildingEffects(
            building
        );


        building.level += 1;


        building.experience = 0;


        building.population =
            Math.floor(
                data.population *
                building.level
            );


        building.workers =
            Math.floor(
                data.workers *
                building.level
            );


        building.happiness =
            data.happiness *
            building.level;


        this.applyBuildingEffects(
            building,
            false
        );


        this.notify(
            "Building Upgraded",
            `${data.icon} ${data.name} is now Level ${building.level}.`
        );


        this.emit(
            "buildingUpgraded",
            building
        );


        return true;
    }


    // =========================================================
    // DEMOLISH
    // =========================================================

    demolishBuilding(
        building
    ) {

        if (!building)
            return false;


        const index =
            this.city.buildings.indexOf(
                building
            );


        if (
            index === -1
        ) {

            return false;
        }


        this.removeBuildingEffects(
            building
        );


        this.city.buildings.splice(
            index,
            1
        );


        const data =
            BuildingEngine.TYPES[
                building.type
            ];


        const refund =
            Math.floor(
                (
                    data.cost *
                    building.level
                ) *
                0.25
            );


        this.city.money +=
            refund;


        this.notify(
            "Building Demolished",
            `Refund received: $${refund.toLocaleString()}.`
        );


        this.emit(
            "buildingDemolished",
            building
        );


        return true;
    }


    // =========================================================
    // BUILDING EFFECTS
    // =========================================================

    applyBuildingEffects(
        building,
        notify = false
    ) {

        const data =
            BuildingEngine.TYPES[
                building.type
            ];


        if (!data)
            return;


        if (
            !this.city.population
        ) {

            this.city.population = 0;

        }


        this.city.population +=
            building.population;


        this.city.happiness +=
            building.happiness;


        if (
            typeof data.power ===
            "number"
        ) {

            if (
                data.power > 0
            ) {

                this.city.power +=
                    data.power;

            }

        }


        this.clampCityStats();


        if (notify) {

            this.emit(
                "cityUpdated",
                this.city
            );

        }
    }


    // =========================================================
    // REMOVE EFFECTS
    // =========================================================

    removeBuildingEffects(
        building
    ) {

        const data =
            BuildingEngine.TYPES[
                building.type
            ];


        if (!data)
            return;


        this.city.population -=
            building.population;


        this.city.happiness -=
            building.happiness;


        if (
            data.power > 0
        ) {

            this.city.power -=
                data.power;

        }


        this.clampCityStats();
    }


    // =========================================================
    // CITY STAT LIMITS
    // =========================================================

    clampCityStats() {

        this.city.population =
            Math.max(
                0,
                Math.floor(
                    this.city.population
                )
            );


        this.city.happiness =
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        this.city.happiness
                    )
                )
            );


        this.city.power =
            Math.max(
                0,
                Math.min(
                    999,
                    Math.round(
                        this.city.power
                    )
                )
            );
    }


    // =========================================================
    // SERVICE COVERAGE
    // =========================================================

    getServiceCoverage(
        building
    ) {

        const data =
            BuildingEngine.TYPES[
                building.type
            ];


        if (!data)
            return 0;


        if (
            !data.serviceRadius
        ) {

            return 0;
        }


        let populationCovered = 0;


        for (
            const other
            of this.city.buildings
        ) {

            if (
                other.type !==
                "house"
            ) {

                continue;
            }


            const distance =
                this.distance(
                    building,
                    other
                );


            if (
                distance <=
                data.serviceRadius
            ) {

                populationCovered +=
                    other.population;
            }
        }


        return populationCovered;
    }


    // =========================================================
    // FIND BUILDING
    // =========================================================

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


    // =========================================================
    // SELECT BUILDING
    // =========================================================

    selectBuilding(
        building
    ) {

        this.selectedBuilding =
            building;


        this.emit(
            "buildingSelected",
            building
        );
    }


    // =========================================================
    // PREVIEW DRAW
    // =========================================================

    drawPreview(
        ctx
    ) {

        if (
            !this.previewBuilding
        ) {

            return;
        }


        const preview =
            this.previewBuilding;


        ctx.save();


        ctx.translate(
            preview.x,
            preview.y
        );


        const valid =
            preview.valid;


        ctx.globalAlpha =
            0.55;


        ctx.fillStyle =
            valid
                ? "#77a96b"
                : "#a05252";


        ctx.fillRect(

            -preview.size / 2,

            -preview.size / 2,

            preview.size,

            preview.size

        );


        ctx.globalAlpha =
            0.9;


        ctx.strokeStyle =
            valid
                ? "#b6d8a7"
                : "#e08080";


        ctx.lineWidth = 2;


        ctx.setLineDash([
            6,
            5
        ]);


        ctx.strokeRect(

            -preview.size / 2,

            -preview.size / 2,

            preview.size,

            preview.size

        );


        ctx.setLineDash([]);


        ctx.restore();

    }


    // =========================================================
    // DRAW BUILDING DETAILS
    // =========================================================

    drawBuildingDetails(
        ctx
    ) {

        for (
            const building
            of this.city.buildings
        ) {

            this.drawBuildingIcon(
                ctx,
                building
            );


            if (
                this.selectedBuilding &&
                this.selectedBuilding.id ===
                    building.id
            ) {

                this.drawSelection(
                    ctx,
                    building
                );

            }
        }
    }


    // =========================================================
    // ICON
    // =========================================================

    drawBuildingIcon(
        ctx,
        building
    ) {

        const data =
            BuildingEngine.TYPES[
                building.type
            ];


        if (!data)
            return;


        ctx.save();


        ctx.translate(
            building.x,
            building.y
        );


        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.font =
            `${Math.max(
                14,
                building.size * 0.35
            )}px Arial`;


        ctx.fillText(
            data.icon,
            0,
            0
        );


        // Level badge

        if (
            building.level > 1
        ) {

            ctx.font =
                "bold 9px Arial";


            ctx.fillStyle =
                "rgba(10,10,10,0.75)";


            ctx.beginPath();

            ctx.roundRect(
                building.size / 2 - 14,
                -building.size / 2 - 7,
                22,
                14,
                5
            );

            ctx.fill();


            ctx.fillStyle =
                "white";


            ctx.fillText(
                "Lv." +
                building.level,

                building.size / 2 - 3,

                -building.size / 2
            );

        }


        ctx.restore();
    }


    // =========================================================
    // SELECTION
    // =========================================================

    drawSelection(
        ctx,
        building
    ) {

        ctx.save();


        ctx.strokeStyle =
            "rgba(255,255,255,0.9)";


        ctx.lineWidth = 2;


        ctx.setLineDash([
            5,
            4
        ]);


        ctx.strokeRect(

            building.x -
                building.size / 2 -
                5,

            building.y -
                building.size / 2 -
                5,

            building.size + 10,

            building.size + 10

        );


        ctx.setLineDash([]);


        ctx.restore();
    }


    // =========================================================
    // SCREEN TO WORLD
    // =========================================================

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


    // =========================================================
    // DISTANCE
    // =========================================================

    distance(
        a,
        b
    ) {

        const dx =
            a.x -
            b.x;


        const dy =
            a.y -
            b.y;


        return Math.sqrt(
            dx * dx +
            dy * dy
        );
    }


    // =========================================================
    // CANCEL
    // =========================================================

    cancelPlacement() {

        this.isPlacing = false;

        this.previewBuilding =
            null;
    }


    // =========================================================
    // EVENT SYSTEM
    // =========================================================

    emit(
        name,
        detail
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "metrocity:" + name,
                {
                    detail
                }
            )
        );
    }


    // =========================================================
    // NOTIFICATION
    // =========================================================

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


    // =========================================================
    // ID
    // =========================================================

    generateId(
        prefix
    ) {

        return (
            prefix +
            "_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );
    }
}
