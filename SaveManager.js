/* ============================================================
   METROCITY V5 — SaveManager
   Complete Save / Load / Export / Import / Delete System
============================================================ */

export class SaveManager {

    static SAVE_KEY = "metrocity_v5_save";

    static VERSION = 5;


    constructor(city, camera) {

        this.city = city;

        this.camera = camera;

        this.autoSaveInterval = null;

        this.autoSaveEnabled = true;

        this.autoSaveTime = 30000;

        this.lastSavedAt = null;

        this.startAutoSave();
    }


    /* ========================================================
       SERIALIZE CITY
    ======================================================== */

    createSaveData() {

        return {

            version:
                SaveManager.VERSION,

            city:
                this.clone(
                    this.city
                ),

            camera: {

                x:
                    Number(
                        this.camera?.x || 0
                    ),

                y:
                    Number(
                        this.camera?.y || 0
                    ),

                zoom:
                    Number(
                        this.camera?.zoom || 1
                    ),

                targetZoom:
                    Number(
                        this.camera?.targetZoom || 1
                    )
            },

            speed:
                Number(
                    window.metroCity?.speed ||
                    window.metroCitySpeed ||
                    1
                ),

            savedAt:
                Date.now()
        };
    }


    /* ========================================================
       SAVE
    ======================================================== */

    save(options = {}) {

        try {

            const saveData =
                this.createSaveData();


            localStorage.setItem(

                SaveManager.SAVE_KEY,

                JSON.stringify(
                    saveData
                )

            );


            this.lastSavedAt =
                saveData.savedAt;


            if (
                !options.silent
            ) {

                this.notify(
                    "Game Saved",
                    "Your city has been saved successfully."
                );
            }


            window.dispatchEvent(
                new CustomEvent(
                    "metrocity:gameSaved",
                    {
                        detail: saveData
                    }
                )
            );


            return true;

        } catch (error) {

            console.error(
                "MetroCity Save Error:",
                error
            );


            if (
                !options.silent
            ) {

                this.notify(
                    "Save Failed",
                    "Unable to save your city."
                );
            }


            return false;
        }
    }


    /* ========================================================
       LOAD
    ======================================================== */

    load(options = {}) {

        try {

            const raw =
                localStorage.getItem(
                    SaveManager.SAVE_KEY
                );


            if (!raw) {

                if (
                    !options.silent
                ) {

                    this.notify(
                        "No Save Found",
                        "No saved city was found."
                    );
                }


                return false;
            }


            const data =
                JSON.parse(
                    raw
                );


            if (
                !this.validateSave(
                    data
                )
            ) {

                throw new Error(
                    "Invalid MetroCity save."
                );
            }


            this.restoreCity(
                data.city
            );


            this.restoreCamera(
                data.camera
            );


            /*
             * Restore simulation speed.
             */

            const speed =
                Number(
                    data.speed || 1
                );


            if (
                window.metroCity
            ) {

                window.metroCity.speed =
                    speed;
            }


            window.metroCitySpeed =
                speed;


            this.lastSavedAt =
                data.savedAt ||
                null;


            window.dispatchEvent(
                new CustomEvent(
                    "metrocity:gameLoaded",
                    {
                        detail: data
                    }
                )
            );


            if (
                !options.silent
            ) {

                this.notify(
                    "Game Loaded",
                    "Your saved city has been restored."
                );
            }


            return true;

        } catch (error) {

            console.error(
                "MetroCity Load Error:",
                error
            );


            if (
                !options.silent
            ) {

                this.notify(
                    "Load Failed",
                    "The saved city could not be loaded."
                );
            }


            return false;
        }
    }


    /* ========================================================
       VALIDATE SAVE
    ======================================================== */

    validateSave(
        data
    ) {

        if (
            !data ||
            typeof data !== "object"
        ) {

            return false;
        }


        if (
            !data.city ||
            typeof data.city !== "object"
        ) {

            return false;
        }


        if (
            !Array.isArray(
                data.city.buildings
            )
        ) {

            return false;
        }


        if (
            !Array.isArray(
                data.city.roads
            )
        ) {

            return false;
        }


        return true;
    }


    /* ========================================================
       RESTORE CITY
    ======================================================== */

    restoreCity(
        savedCity
    ) {

        /*
         * Keep the original city object
         * reference so every engine
         * continues using the same object.
         */

        const existingKeys =
            Object.keys(
                this.city
            );


        existingKeys.forEach(
            key => {

                delete this.city[key];

            }
        );


        Object.assign(
            this.city,
            this.clone(
                savedCity
            )
        );


        /*
         * Safety defaults.
         */

        if (
            !Array.isArray(
                this.city.roads
            )
        ) {

            this.city.roads =
                [];
        }


        if (
            !Array.isArray(
                this.city.buildings
            )
        ) {

            this.city.buildings =
                [];
        }


        if (
            !Array.isArray(
                this.city.intersections
            )
        ) {

            this.city.intersections =
                [];
        }


        if (
            !this.city.statistics
        ) {

            this.city.statistics = {

                income:
                    0,

                expenses:
                    0,

                totalIncome:
                    0,

                totalExpenses:
                    0,

                buildingsBuilt:
                    0,

                buildingsDemolished:
                    0,

                roadsBuilt:
                    0,

                playTime:
                    0
            };
        }


        /*
         * Current tool should never be
         * restored from a save.
         */

        this.city.currentTool =
            null;
    }


    /* ========================================================
       RESTORE CAMERA
    ======================================================== */

    restoreCamera(
        savedCamera
    ) {

        if (
            !savedCamera ||
            !this.camera
        ) {

            return;
        }


        this.camera.x =
            Number(
                savedCamera.x || 0
            );


        this.camera.y =
            Number(
                savedCamera.y || 0
            );


        this.camera.zoom =
            Number(
                savedCamera.zoom || 1
            );


        this.camera.targetZoom =
            Number(
                savedCamera.targetZoom ||
                this.camera.zoom ||
                1
            );


        /*
         * Keep zoom inside allowed range.
         */

        if (
            this.camera.minZoom !==
            undefined
        ) {

            this.camera.zoom =
                Math.max(
                    this.camera.minZoom,
                    this.camera.zoom
                );


            this.camera.targetZoom =
                Math.max(
                    this.camera.minZoom,
                    this.camera.targetZoom
                );
        }


        if (
            this.camera.maxZoom !==
            undefined
        ) {

            this.camera.zoom =
                Math.min(
                    this.camera.maxZoom,
                    this.camera.zoom
                );


            this.camera.targetZoom =
                Math.min(
                    this.camera.maxZoom,
                    this.camera.targetZoom
                );
        }
    }


    /* ========================================================
       HAS SAVE
    ======================================================== */

    hasSave() {

        try {

            return Boolean(
                localStorage.getItem(
                    SaveManager.SAVE_KEY
                )
            );

        } catch {

            return false;
        }
    }


    /* ========================================================
       GET SAVE INFO
    ======================================================== */

    getSaveInfo() {

        try {

            const raw =
                localStorage.getItem(
                    SaveManager.SAVE_KEY
                );


            if (!raw) {

                return null;
            }


            const data =
                JSON.parse(
                    raw
                );


            if (
                !this.validateSave(
                    data
                )
            ) {

                return null;
            }


            return {

                version:
                    data.version ||
                    1,

                cityName:
                    data.city?.name ||
                    "New City",

                money:
                    Number(
                        data.city?.money ||
                        0
                    ),

                population:
                    Number(
                        data.city?.population ||
                        0
                    ),

                happiness:
                    Number(
                        data.city?.happiness ||
                        0
                    ),

                buildings:
                    Array.isArray(
                        data.city?.buildings
                    )
                        ? data.city.buildings.length
                        : 0,

                roads:
                    Array.isArray(
                        data.city?.roads
                    )
                        ? data.city.roads.length
                        : 0,

                savedAt:
                    data.savedAt ||
                    null
            };

        } catch {

            return null;
        }
    }


    /* ========================================================
       DELETE SAVE
    ======================================================== */

    deleteSave(
        options = {}
    ) {

        try {

            localStorage.removeItem(
                SaveManager.SAVE_KEY
            );


            this.lastSavedAt =
                null;


            window.dispatchEvent(
                new CustomEvent(
                    "metrocity:saveDeleted"
                )
            );


            if (
                !options.silent
            ) {

                this.notify(
                    "Save Deleted",
                    "The saved city has been removed."
                );
            }


            return true;

        } catch (error) {

            console.error(
                "MetroCity Delete Save Error:",
                error
            );


            return false;
        }
    }


    /* ========================================================
       EXPORT SAVE
    ======================================================== */

    exportSave() {

        try {

            const saveData =
                this.createSaveData();


            const json =
                JSON.stringify(
                    saveData,
                    null,
                    2
                );


            const blob =
                new Blob(
                    [
                        json
                    ],
                    {
                        type:
                            "application/json"
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            const cityName =
                String(
                    this.city.name ||
                    "metrocity"
                )
                    .trim()
                    .replace(
                        /[^a-z0-9-_]+/gi,
                        "_"
                    );


            link.href =
                url;


            link.download =
                `${cityName}_metrocity_v5.json`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                () => {

                    URL.revokeObjectURL(
                        url
                    );

                },
                1000
            );


            this.notify(
                "Save Exported",
                "Your city save file has been exported."
            );


            return true;

        } catch (error) {

            console.error(
                "MetroCity Export Error:",
                error
            );


            this.notify(
                "Export Failed",
                "Unable to export the city save."
            );


            return false;
        }
    }


    /* ========================================================
       IMPORT SAVE
    ======================================================== */

    importSaveFile(
        file
    ) {

        return new Promise(
            resolve => {

                if (!file) {

                    resolve(
                        false
                    );

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    event => {

                        try {

                            const data =
                                JSON.parse(
                                    event.target.result
                                );


                            if (
                                !this.validateSave(
                                    data
                                )
                            ) {

                                throw new Error(
                                    "Invalid save file."
                                );
                            }


                            /*
                             * Save imported data
                             * to local storage.
                             */

                            localStorage.setItem(

                                SaveManager.SAVE_KEY,

                                JSON.stringify(
                                    data
                                )

                            );


                            /*
                             * Immediately restore.
                             */

                            this.restoreCity(
                                data.city
                            );


                            this.restoreCamera(
                                data.camera
                            );


                            const speed =
                                Number(
                                    data.speed ||
                                    1
                                );


                            if (
                                window.metroCity
                            ) {

                                window.metroCity.speed =
                                    speed;
                            }


                            window.metroCitySpeed =
                                speed;


                            this.lastSavedAt =
                                data.savedAt ||
                                Date.now();


                            window.dispatchEvent(
                                new CustomEvent(
                                    "metrocity:gameLoaded",
                                    {
                                        detail:
                                            data
                                    }
                                )
                            );


                            this.notify(
                                "Save Imported",
                                "Your city has been imported successfully."
                            );


                            resolve(
                                true
                            );

                        } catch (error) {

                            console.error(
                                "MetroCity Import Error:",
                                error
                            );


                            this.notify(
                                "Import Failed",
                                "This save file is invalid or corrupted."
                            );


                            resolve(
                                false
                            );
                        }
                    };


                reader.onerror =
                    () => {

                        this.notify(
                            "Import Failed",
                            "Unable to read the save file."
                        );


                        resolve(
                            false
                        );
                    };


                reader.readAsText(
                    file
                );

            }
        );
    }


    /* ========================================================
       IMPORT FILE PICKER
    ======================================================== */

    openImportDialog() {

        const input =
            document.createElement(
                "input"
            );


        input.type =
            "file";


        input.accept =
            ".json,application/json";


        input.style.display =
            "none";


        document.body.appendChild(
            input
        );


        input.addEventListener(
            "change",
            async () => {

                const file =
                    input.files?.[0];


                if (file) {

                    await this.importSaveFile(
                        file
                    );
                }


                input.remove();
            }
        );


        input.click();
    }


    /* ========================================================
       AUTO SAVE
    ======================================================== */

    startAutoSave() {

        this.stopAutoSave();


        if (
            !this.autoSaveEnabled
        ) {

            return;
        }


        this.autoSaveInterval =
            setInterval(
                () => {

                    /*
                     * Never auto-save while
                     * the page is hidden.
                     */

                    if (
                        document.hidden
                    ) {

                        return;
                    }


                    if (
                        window.metroCity?.paused
                    ) {

                        /*
                         * We still save paused
                         * cities because the user
                         * may leave the game.
                         */

                    }


                    this.save({
                        silent:
                            true
                    });

                },

                this.autoSaveTime
            );
    }


    /* ========================================================
       STOP AUTO SAVE
    ======================================================== */

    stopAutoSave() {

        if (
            this.autoSaveInterval
        ) {

            clearInterval(
                this.autoSaveInterval
            );


            this.autoSaveInterval =
                null;
        }
    }


    /* ========================================================
       SET AUTO SAVE
    ======================================================== */

    setAutoSave(
        enabled
    ) {

        this.autoSaveEnabled =
            Boolean(
                enabled
            );


        if (
            this.autoSaveEnabled
        ) {

            this.startAutoSave();

        } else {

            this.stopAutoSave();
        }


        return this.autoSaveEnabled;
    }


    /* ========================================================
       SET AUTO SAVE INTERVAL
    ======================================================== */

    setAutoSaveInterval(
        milliseconds
    ) {

        const value =
            Number(
                milliseconds
            );


        if (
            !Number.isFinite(
                value
            ) ||
            value < 5000
        ) {

            return false;
        }


        this.autoSaveTime =
            value;


        if (
            this.autoSaveEnabled
        ) {

            this.startAutoSave();
        }


        return true;
    }


    /* ========================================================
       QUICK SAVE
    ======================================================== */

    quickSave() {

        return this.save();
    }


    /* ========================================================
       QUICK LOAD
    ======================================================== */

    quickLoad() {

        return this.load();
    }


    /* ========================================================
       BACKUP
    ======================================================== */

    createBackup() {

        try {

            const data =
                this.createSaveData();


            const backupKey =
                `${SaveManager.SAVE_KEY}_backup`;


            localStorage.setItem(

                backupKey,

                JSON.stringify(
                    data
                )

            );


            return true;

        } catch (error) {

            console.error(
                "MetroCity Backup Error:",
                error
            );


            return false;
        }
    }


    /* ========================================================
       RESTORE BACKUP
    ======================================================== */

    restoreBackup() {

        try {

            const backupKey =
                `${SaveManager.SAVE_KEY}_backup`;


            const raw =
                localStorage.getItem(
                    backupKey
                );


            if (!raw) {

                this.notify(
                    "No Backup Found",
                    "No backup city was found."
                );

                return false;
            }


            const data =
                JSON.parse(
                    raw
                );


            if (
                !this.validateSave(
                    data
                )
            ) {

                throw new Error(
                    "Invalid backup."
                );
            }


            localStorage.setItem(

                SaveManager.SAVE_KEY,

                JSON.stringify(
                    data
                )

            );


            this.restoreCity(
                data.city
            );


            this.restoreCamera(
                data.camera
            );


            window.metroCitySpeed =
                Number(
                    data.speed || 1
                );


            if (
                window.metroCity
            ) {

                window.metroCity.speed =
                    window.metroCitySpeed;
            }


            window.dispatchEvent(
                new CustomEvent(
                    "metrocity:gameLoaded",
                    {
                        detail:
                            data
                    }
                )
            );


            this.notify(
                "Backup Restored",
                "Your backup city has been restored."
            );


            return true;

        } catch (error) {

            console.error(
                "MetroCity Backup Restore Error:",
                error
            );


            this.notify(
                "Restore Failed",
                "Unable to restore the backup."
            );


            return false;
        }
    }


    /* ========================================================
       CLEAR ALL DATA
    ======================================================== */

    clearAllData(
        options = {}
    ) {

        try {

            localStorage.removeItem(
                SaveManager.SAVE_KEY
            );


            localStorage.removeItem(
                `${SaveManager.SAVE_KEY}_backup`
            );


            if (
                !options.silent
            ) {

                this.notify(
                    "Data Cleared",
                    "MetroCity save data has been cleared."
                );
            }


            return true;

        } catch (error) {

            console.error(
                "MetroCity Clear Data Error:",
                error
            );


            return false;
        }
    }


    /* ========================================================
       CLONE
    ======================================================== */

    clone(
        value
    ) {

        try {

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch {

            return {};
        }
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


    /* ========================================================
       DESTROY
    ======================================================== */

    destroy() {

        this.stopAutoSave();

        this.city =
            null;

        this.camera =
            null;
    }

}
