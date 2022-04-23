import * as ControlsUI from "./ControlsUI.js";
import * as TasksUI from "./TasksUI.js";
import * as TasksData from "./TasksData.js";
import * as Storage from "./Storage.js"


const STORE_NAME = 'tasks';

/**
 * Register handler and connect up the application
 */
document.addEventListener('DOMContentLoaded', () => {
    const updateCB = (tasks) => {
        listUI.update(tasks);
        store.save(tasks, STORE_NAME)
    }

    // instantiate controllers and model
    const controlsUI = ControlsUI.create();
    
    const listUI = TasksUI.create();
    const tasks = TasksData.create();
    const store = Storage.create();

    // link modules
    controlsUI.initialise({
        newInputCB  : tasks.add,
        randomiseCB : tasks.randomise
    })

    listUI.initialise({
        moveCB      : tasks.move,
        removeCB    : tasks.remove,
        setValueCB  : tasks.setValue,
        toggleDoneCB : tasks.toggleDone
    });

    tasks.initialise(store.load(STORE_NAME), {updateCB})

    
    // setup the UI
    controlsUI.hideHelp();
    controlsUI.setFocus();      //  focus to input by default

    // re-order tasks
    tasks.sort();
    
    // debug
    if (tasks.get().length == 0) {
        tasks.add('one: hello; two: a longer task; three: bye');
        // tasks.add('four: more');
        // tasks.add('five: hive');
        // tasks.add('six: pick up sticks');
    }
    
});
