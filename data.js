// Program variables
let list = [];
let nextID = 1;       // maintain a running count as ID

// task and task list manipulation

export const addTask = (value) => {
    const task = {
        id    :  `task-${nextID}`,
        isDone:  false,
        value
    }

    nextID++;
    list.push(task);
    saveTasks();
    return task;
};

export const addTasks = (values) => {
    const tasks = [];
    for (const value of values) {
        const task = {
            id    :  `task-${nextID}`,
            isDone:  false,
            value
        }
    
        nextID++;
        tasks.push(task);
    }
    list = [...list, ...tasks];
    saveTasks();
};

const getTaskByID = (id) => {
    const task = list.find( t => t.id == id);
    return task;
}

export const getTaskValue = (id) => {
    const task = getTaskByID(id);
    return task.value;
}

export const setTaskValue = (id, value) => {
    const task = getTaskByID(id);
    task.value  = value;
    task.isDone = false; // modified tasks are incomplete
    saveTasks();
}

export const toggleTaskDone = (id) => {
    const task = getTaskByID(id);
    task.isDone = !task.isDone;
    saveTasks();
}

export const moveTask = (id, beforeId) => {
    const tI = list.findIndex(t => t.id == id);
    const bI = list.findIndex(t => t.id == beforeId);
    const nI = (bI < 0)? list.length - 1 : (tI < bI)? bI - 1 : bI;
    if (nI != tI) { 
        // new index and current task index are different => move the task
        const task = list[tI];
        list = [...list.slice(0,tI), ...list.slice(tI+1)];  // remove task from list
        list.splice(nI, 0, task);
        saveTasks();
    }
};

export const removeTask = (id) => {
    const index = list.findIndex( t => t.id == id );
    list = [...list.slice(0,index), ...list.slice(index+1)];
    saveTasks();
}

// returns ordered list of tasks
export const getTaskList = () => {
    return [...list];
}

// utility functions
const saveTasks = () => {
    // pushed program state to local storage, this allows lists - etc, to be stored between sessions
    localStorage.setItem('tasks', JSON.stringify(list));
}

export const loadTasks = () => {
    list   = JSON.parse(localStorage.getItem('tasks')) || [];
    nextID = (list.length > 0)? Math.max(...list.map(t => t.id.slice(5))) + 1 : 1;
}

// sort todo's from done
export const sortTasks = () => {
    const todo = [];
    const done = [];
    
    list.forEach( t => { (t.isDone)? todo.push(t) : done.push(t) } );
    const sorted = [...todo, ...done];

    let changed = false;
    for (let i = 0; i < list.length; i++) {
        if (list[i].id != sorted[i].id) {
            changed = true;
            break;
        }
    }

    if (changed) {
        list = sorted;
        saveTasks();
    }
}

export const randomiseTasks = () => {
    let todo = [];
    const done = [];
    // 1. sort into todo and done    
    list.forEach( t => {(t.isDone)? done.push(t) : todo.push(t);} );
// console.log('starting randomize');
// console.table(list);
// console.table(todo);
// console.table(done);
    // 2. shuffle todo's into a new array 
    const shuffle = [];
    while (todo.length > 0) {
        const index = Math.floor(Math.random()*todo.length);
        // this isn't very efficient... but we're only working with small arrays...
        shuffle.push(todo[index])
        todo = [...todo.slice(0,index), ...todo.slice(index+1)];
    }
    shuffle.push(...done);
// console.table(shuffle);    
    let changed = false;
    for (let i = 0; i < list.length; i++) {
        if (list[i].id != shuffle[i].id) {
            changed = true;
            break;
        }
    }
// console.log(`changed?: ${changed}`)
    if (changed) {
        list = shuffle;
        saveTasks();
    }
// console.table(list);
// console.log('end random')
}