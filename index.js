import * as data from "./data.js";
import * as dom  from "./dom.js";

// written this way to allow for animations... @TODO
const reloadDomTasks = (list) => {
    if (list.length == 0) return;

    const queue = [];

    // remove items from list in reverse current order
    const domList = dom.getList().reverse();
    let beforeEl = null;
    domList.forEach( tEl => {
        if (list.findIndex(t => t.id == tEl.id.slice(5)) >= 0) {
            queue.push( () => {dom.removeTask( tEl ); } );
        } else {
            beforeEl = tEl;
        }
    });
        
    // re-add in new order
    list.forEach( t => { 
        // find existing or create new task element
        const taskEl = domList.find( tEl => t.id == tEl.id.slice(5) ) || dom.createTask(t.id, t.value, t.isDone);
        queue.push(() => { dom.insertTask(taskEl, beforeEl); }); 
    });

    dom.animateQueue(queue);
};


// handlers (half-breeds)

/**
 * Task click event handler.
 * Handles checking (done), triggering edits and deleting.
 */
const handleClickTask = (event) => {
    const {action, id} = dom.getClickTaskAction(event);
// console.log(`click action: ${action}, ${id}`);
    switch (action) {
        case dom.TASK_ACTION.DELETE:
            data.removeTask(id);
            dom.updateTasks(data.getTaskList());
            break;
    
        case dom.TASK_ACTION.EDIT:
            dom.startTaskEdit(event, data.getTaskValue(id));
            break;

        default: // mark mode
            data.toggleTaskDone(id);
            dom.updateTasks(data.getTaskList());
            break;
    }
};

const handleDragEndTask = (event) => {
    const {id, beforeId} = dom.endDrag(event);

    data.moveTask(id, beforeId);
    dom.updateTasks(data.getTaskList());
};

const handleClickRandomize = (event) => {
    data.randomiseTasks();
    dom.updateTasks(data.getTaskList());
};

const handleEditTask = (event) => {
    const {id, value} = dom.endTaskEdit(event);
        
    if ( value != data.getTaskValue(id) ) {
        data.setTaskValue(id, value);
        dom.updateTasks(data.getTaskList());
    }
}

const handleNewTask = (event) => {
    const value = dom.getAndClearTaskInput(event);
    
    if (!value || value == '') return;
    
    data.addTasks(value.split(';'));
    dom.updateTasks(data.getTaskList());
};


/**
 * Register handler and connect up the application
 */
document.addEventListener('DOMContentLoaded', () => {
    dom.setHandlers({
        onNewTask        : handleNewTask,
        onClickTask      : handleClickTask,
        onDragStartTask  : dom.startDrag,
        onDragStartEnd   : handleDragEndTask,
        onDragOverList   : dom.previewDrag,
        onChangeTaskEdit : handleEditTask,
        onClickRandomize : handleClickRandomize,
        onClickHelp      : dom.showHelpModal
    });

    // restore tasks
    data.loadTasks();
    data.sortTasks();
    dom.updateTasks(data.getTaskList())

    // set focus to input by default
    dom.setFocusToNewInput();

    // debug
    if (data.getTaskList().length == 0) addTestTasks()
});

//debug...
const addTestTasks = () => {
    ['one: hello', 'two: a longer task', 'three: bye'].map( val => data.addTask(val));
    dom.updateTasks(data.getTaskList());
}