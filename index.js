import * as Data from "./data.js";
import * as UI from "./dom.js";
import * as Storage from "./Storage.js"

// todo: move to ui?

/**
 * Task click event handler.
 * Handles checking (done), triggering edits and deleting.
 */
const handleClickTask = (event) => {
    const {action, id} = UI.getClickTaskAction(event);
// console.log(`click action: ${action}, ${id}`);
    switch (action) {
        case UI.TASK_ACTION.DELETE:
            Data.removeTask(id);
            UI.updateTasks(Data.getTaskList());
            break;
    
        case UI.TASK_ACTION.EDIT:
            UI.startTaskEdit(event, Data.getTaskValue(id));
            break;

        default: // mark mode
            Data.toggleTaskDone(id);
            UI.updateTasks(Data.getTaskList());
            break;
    }
};

const handleDragEndTask = (event) => {
    const {id, beforeId} = UI.endDrag(event);

    Data.moveTask(id, beforeId);
    UI.updateTasks(Data.getTaskList());
};

const handleClickRandomize = (event) => {
    Data.randomiseTasks();
    UI.updateTasks(Data.getTaskList());
};

const handleEditTask = (event) => {
    const {id, value} = UI.endTaskEdit(event);
        
    if ( value != Data.getTaskValue(id) ) {
        Data.setTaskValue(id, value);
        UI.updateTasks(Data.getTaskList());
    }
}

const handleNewTask = (event) => {
    const value = UI.getAndClearTaskInput(event);
    
    if (!value || value == '') return;
    
    Data.addTasks(value.split(';'));
    UI.updateTasks(Data.getTaskList());
};


/**
 * Register handler and connect up the application
 */
document.addEventListener('DOMContentLoaded', () => {
    const store = Storage.initialise();

    // hacky for now...
    Data.setHandlers({ store });

    UI.setHandlers({
        onNewTask        : handleNewTask,
        onClickTask      : handleClickTask,
        onDragStartTask  : UI.startDrag,
        onDragStartEnd   : handleDragEndTask,
        onDragOverList   : UI.handleDrag,
        onChangeTaskEdit : handleEditTask,
        onClickRandomize : handleClickRandomize,
        onClickHelp      : UI.showHelpModal
    });

    // restore tasks
    Data.load();
    Data.sortTasks();
    UI.updateTasks(Data.getTaskList())

    // set focus to input by default
    UI.setFocusToNewInput();

    // debug
    if (Data.getTaskList().length == 0) addTestTasks()
});

//debug...
const addTestTasks = () => {
    ['one: hello', 'two: a longer task', 'three: bye'].map( val => Data.addTask(val));
    UI.updateTasks(Data.getTaskList());
}