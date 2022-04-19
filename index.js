import * as Tasks from "./TasksData.js";
import * as ListView from "./TasksUI.js";
import * as Storage from "./Storage.js"


/**
 * Register handler and connect up the application
 */
document.addEventListener('DOMContentLoaded', () => {
    //debug...
    const addTestTasks = () => {
        ['one: hello', 'two: a longer task', 'three: bye'].map( val => tasks.add(val));
        ListView.update(tasks.get());
    }

    // todo: move to ui?
    /**
     * Task click event handler.
     * Handles checking (done), triggering edits and deleting.
     */
    const handleClickTask = (event) => {
        const {action, id} = ListView.getClickTaskAction(event);
    // console.log(`click action: ${action}, ${id}`);
        switch (action) {
            case ListView.TASK_ACTION.DELETE:
                tasks.remove(id);
                listUI.update(tasks.get());
                break;
        
            case ListView.TASK_ACTION.EDIT:
                listUI.startEdit(event);
                break;

            default: // mark mode
                tasks.toggleDone(id);
                listUI.update(tasks.get());
                break;
        }
    };

    const handleDragEndTask = (event) => {
        const {moved, id, beforeId} = listUI.endDrag(event);

        if (moved) {
            tasks.move({id, beforeId});
            listUI.update(tasks.get());
        }
    };

    const handleClickRandomize = (event) => {
        tasks.randomise();
        listUI.update(tasks.get());
    };

    const handleEditTask = (event) => {
        const {id, value, changed} = listUI.endEdit(event);
        if ( changed ) {
            tasks.setValue({id, value});
            listUI.update(tasks.get());
        }
    }

    const handleNewTask = (event) => {
        const value = ListView.getAndClearTaskInput(event);
        
        if (!value || value == '') return;
        
        for (const val of value.split(';')) tasks.add(val);
        listUI.update(tasks.get());
    };

    // start of code to keep
    const store = Storage.initialise();

    // hacky for now...
    const tasks = Tasks.initialise(store);
    const listUI = ListView.create({
            onNewTask        : handleNewTask,
            onClickTask      : handleClickTask,
            onDragEndTask    : handleDragEndTask,
            onChangeTaskEdit : handleEditTask,
            onClickRandomize : handleClickRandomize,
            onClickHelp      : ListView.showHelpModal
    });
    listUI.initialise();


    // restore tasks
    //tasks.load();
    tasks.sort();
    listUI.update(tasks.get());

    // set focus to input by default
    ListView.setFocusToNewInput();

    // debug
    if (tasks.get().length == 0) addTestTasks()
});
