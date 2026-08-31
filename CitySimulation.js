/* ============================================================
   METROCITY V5 — CitySimulation
   Economy + Population + Jobs + Services
============================================================ */

export class CitySimulation {

    constructor(city, options = {}) {

        this.city = city;

        this.tickRate =
            options.tickRate || 5000;

        this.running = true;

        this.paused = false;

        this.speed = 1;

        this.timer = null;

        this.lastTick = Date.now();

        this.start();

    }


    /* ========================================================
       START
    ======================================================== */

    start() {

        if (this.timer) {
            return;
        }

        this.timer = setInterval(
            () => {

                this.update();

            },
            this.tickRate
        );

    }


    /* ========================================================
       STOP
    ======================================================== */

    stop() {

        if (!this.timer) {
            return;
        }

        clearInterval(
            this.timer
        );

        this.timer = null;

    }


    /* ========================================================
       PAUSE
    ======================================================== */

    pause() {

        this.paused = true;

    }


    /* ========================================================
       RESUME
    ======================================================== */

    resume() {

        this.paused = false;

        this.lastTick =
            Date.now();

    }


    /* ========================================================
       SPEED
    ======================================================== */

    setSpeed(
        value
    ) {

        const allowed = [
            1,
            2,
            4,
            8
        ];

        if (
            !allowed.includes(
                Number(value)
            )
        ) {

            this.speed = 1;

        } else {

            this.speed =
                Number(value);

        }

    }


    /* ========================================================
       MAIN UPDATE
    ======================================================== */

    update() {

        if (
            !this.running ||
            this.paused
        ) {

            return;

        }


        if (!this.city) {
            return;
        }


        const result =
            this.simulateTick();


        window.dispatchEvent(
            new CustomEvent(
                "metrocity:simulationTick",
                {
                    detail: result
                }
            )
        );

    }


    /* ========================================================
       SIMULATION TICK
    ======================================================== */

    simulateTick() {

        const buildings =
            Array.isArray(
                this.city.buildings
            )
                ? this.city.buildings
                : [];


        let population =
            0;

        let jobs =
            0;

        let residentialCapacity =
            0;

        let commercialJobs =
            0;

        let industrialJobs =
            0;

        let serviceJobs =
            0;


        let happiness =
            70;


        let powerSupply =
            0;

        let waterSupply =
            0;


        let powerDemand =
            0;

        let waterDemand =
            0;


        let serviceScore =
            0;


        let serviceCount =
            0;


        let income =
            0;


        let expenses =
            0;


        /* ----------------------------------------------------
           BUILDINGS
        ---------------------------------------------------- */

        for (
            const building
            of buildings
        ) {

            if (!building) {
                continue;
            }


            const type =
                building.type;


            const level =
                Math.max(
                    1,
                    Number(
                        building.level ||
                        1
                    )
                );


            const buildingPopulation =
                Math.max(
                    0,
                    Number(
                        building.population ||
                        0
                    )
                );


            const buildingWorkers =
                Math.max(
                    0,
                    Number(
                        building.workers ||
                        0
                    )
                );


            population +=
                buildingPopulation;


            jobs +=
                buildingWorkers;


            /* ------------------------------------------------
               RESIDENTIAL
            ------------------------------------------------ */

            if (
                type ===
                "house"
            ) {

                residentialCapacity +=
                    buildingPopulation;

            }


            /* ------------------------------------------------
               COMMERCIAL
            ------------------------------------------------ */

            if (
                type ===
                "commercial"
            ) {

                commercialJobs +=
                    buildingWorkers;

            }


            /* ------------------------------------------------
               INDUSTRIAL
            ------------------------------------------------ */

            if (
                type ===
                "industrial"
            ) {

                industrialJobs +=
                    buildingWorkers;

            }


            /* ------------------------------------------------
               SERVICES
            ------------------------------------------------ */

            if (
                [
                    "hospital",
                    "police",
                    "fire",
                    "school",
                    "park",
                    "stadium"
                ].includes(
                    type
                )
            ) {

                serviceJobs +=
                    buildingWorkers;

            }


            /* ------------------------------------------------
               POWER
            ------------------------------------------------ */

            if (
                type ===
                "power"
            ) {

                powerSupply +=
                    Math.max(
                        0,
                        Number(
                            building.service ||
                            0
                        )
                    );

            }


            /* ------------------------------------------------
               WATER
            ------------------------------------------------ */

            if (
                type ===
                "water"
            ) {

                waterSupply +=
                    Math.max(
                        0,
                        Number(
                            building.service ||
                            0
                        )
                    );

            }


            /* ------------------------------------------------
               DEMAND
            ------------------------------------------------ */

            if (
                type !==
                "power"
            ) {

                powerDemand +=
                    Math.max(
                        1,
                        buildingPopulation *
                        0.04
                    );

            }


            if (
                type !==
                "water"
            ) {

                waterDemand +=
                    Math.max(
                        1,
                        buildingPopulation *
                        0.035
                    );

            }


            /* ------------------------------------------------
               HAPPINESS
            ------------------------------------------------ */

            happiness +=
                Number(
                    building.happiness ||
                    0
                ) *
                0.15;


            /* ------------------------------------------------
               TAX INCOME
            ------------------------------------------------ */

            income +=
                buildingPopulation *
                0.12;


            income +=
                buildingWorkers *
                0.05;


            /*
             * Higher levels generate
             * slightly more economy.
             */

            income *=
                1 +
                (
                    level -
                    1
                ) *
                0.08;


            /* ------------------------------------------------
               MAINTENANCE
            ------------------------------------------------ */

            const baseMaintenance =
                this.getMaintenanceCost(
                    type
                );


            expenses +=
                baseMaintenance *
                level;

        }


        /* ====================================================
           POWER
        ==================================================== */

        let powerPercent =
            100;


        if (
            powerDemand > 0
        ) {

            powerPercent =
                Math.min(
                    100,
                    (
                        powerSupply /
                        powerDemand
                    ) *
                    100
                );

        }


        /* ====================================================
           WATER
        ==================================================== */

        let waterPercent =
            100;


        if (
            waterDemand > 0
        ) {

            waterPercent =
                Math.min(
                    100,
                    (
                        waterSupply /
                        waterDemand
                    ) *
                    100
                );

        }


        /* ====================================================
           ROAD ACCESS
        ==================================================== */

        const roads =
            Array.isArray(
                this.city.roads
            )
                ? this.city.roads
                : [];


        const roadCount =
            roads.length;


        const roadScore =
            Math.min(
                100,
                roadCount *
                4
            );


        /* ====================================================
           SERVICES
        ==================================================== */

        for (
            const building
            of buildings
        ) {

            if (!building) {
                continue;
            }


            const service =
                Number(
                    building.service ||
                    0
                );


            if (
                service <= 0
            ) {

                continue;

            }


            serviceCount += 1;

            serviceScore +=
                Math.min(
                    100,
                    service
                );

        }


        const averageService =
            serviceCount > 0
                ? serviceScore /
                  serviceCount
                : 0;


        /* ====================================================
           HAPPINESS MODIFIERS
        ==================================================== */

        /*
         * Power
         */

        if (
            powerPercent < 100
        ) {

            happiness -=
                (
                    100 -
                    powerPercent
                ) *
                0.12;

        }


        /*
         * Water
         */

        if (
            waterPercent < 100
        ) {

            happiness -=
                (
                    100 -
                    waterPercent
                ) *
                0.10;

        }


        /*
         * Roads
         */

        happiness +=
            roadScore *
            0.08;


        /*
         * Services
         */

        happiness +=
            averageService *
            0.05;


        /*
         * Job availability
         */

        const jobDemand =
            population *
            0.55;


        let employment =
            100;


        if (
            jobDemand > 0
        ) {

            employment =
                Math.min(
                    100,
                    (
                        jobs /
                        jobDemand
                    ) *
                    100
                );

        }


        if (
            employment < 100
        ) {

            happiness -=
                (
                    100 -
                    employment
                ) *
                0.06;

        }


        /*
         * Cap happiness.
         */

        happiness =
            Math.max(
                0,
                Math.min(
                    100,
                    happiness
                )
            );


        /* ====================================================
           HAPPINESS ECONOMY BONUS
        ==================================================== */

        const happinessMultiplier =
            0.65 +
            (
                happiness /
                100
            ) *
            0.35;


        income *=
            happinessMultiplier;


        /* ====================================================
           SPEED
        ==================================================== */

        income *=
            this.speed;


        expenses *=
            this.speed;


        /* ====================================================
           NET MONEY
        ==================================================== */

        const netIncome =
            income -
            expenses;


        this.city.money +=
            netIncome;


        /*
         * Prevent negative money display
         * from breaking the UI.
         */

        if (
            !Number.isFinite(
                this.city.money
            )
        ) {

            this.city.money = 0;

        }


        /* ====================================================
           POPULATION GROWTH
        ==================================================== */

        let populationGrowth =
            0;


        if (
            happiness >= 60 &&
            residentialCapacity > population
        ) {

            populationGrowth =
                Math.max(
                    1,
                    Math.round(
                        population *
                        0.001 *
                        (
                            happiness /
                            70
                        ) *
                        this.speed
                    )
                );


            const availableSpace =
                Math.max(
                    0,
                    residentialCapacity -
                    population
                );


            populationGrowth =
                Math.min(
                    populationGrowth,
                    availableSpace
                );

        }


        /*
         * Bad happiness can cause
         * small population decline.
         */

        if (
            happiness < 35 &&
            population > 0
        ) {

            populationGrowth =
                -Math.max(
                    1,
                    Math.round(
                        population *
                        0.0005
                    )
                );

        }


        population =
            Math.max(
                0,
                Math.round(
                    population +
                    populationGrowth
                )
            );


        /* ====================================================
           UPDATE CITY
        ==================================================== */

        this.city.population =
            population;


        this.city.workers =
            Math.round(
                jobs
            );


        this.city.happiness =
            Math.round(
                happiness
            );


        this.city.power =
            Math.round(
                powerPercent
            );


        this.city.water =
            Math.round(
                waterPercent
            );


        this.city.employment =
            Math.round(
                employment
            );


        /* ====================================================
           STATISTICS
        ==================================================== */

        if (
            !this.city.statistics
        ) {

            this.city.statistics = {};

        }


        this.city.statistics.income =
            Math.round(
                income
            );


        this.city.statistics.expenses =
            Math.round(
                expenses
            );


        this.city.statistics.totalIncome =
            Number(
                this.city.statistics
                    .totalIncome || 0
            ) +
            income;


        this.city.statistics.totalExpenses =
            Number(
                this.city.statistics
                    .totalExpenses || 0
            ) +
            expenses;


        /* ====================================================
           RESULT
        ==================================================== */

        return {

            income,

            expenses,

            netIncome,

            population,

            populationGrowth,

            jobs,

            employment,

            happiness,

            power:
                powerPercent,

            water:
                waterPercent,

            roadScore,

            serviceScore:
                averageService

        };

    }


    /* ========================================================
       MAINTENANCE
    ======================================================== */

    getMaintenanceCost(
        type
    ) {

        const costs = {

            house:
                2,

            commercial:
                5,

            industrial:
                8,

            hospital:
                35,

            police:
                25,

            fire:
                25,

            school:
                30,

            park:
                4,

            power:
                40,

            water:
                30,

            stadium:
                60

        };


        return (
            costs[type] ??
            2
        );

    }


    /* ========================================================
       CITY SUMMARY
    ======================================================== */

    getSummary() {

        return {

            name:
                this.city.name,

            money:
                this.city.money,

            population:
                this.city.population,

            workers:
                this.city.workers,

            happiness:
                this.city.happiness,

            power:
                this.city.power,

            water:
                this.city.water,

            employment:
                this.city.employment,

            buildings:
                this.city.buildings?.length ||
                0,

            roads:
                this.city.roads?.length ||
                0

        };

    }


    /* ========================================================
       RESET
    ======================================================== */

    reset() {

        this.stop();

        this.running = true;

        this.paused = false;

        this.speed = 1;

        this.lastTick =
            Date.now();

        this.start();

    }


    /* ========================================================
       DESTROY
    ======================================================== */

    destroy() {

        this.stop();

        this.running = false;

    }

}
