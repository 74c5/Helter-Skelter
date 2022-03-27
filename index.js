// Program variables
let tasks = [];
let nextID = 1;       // maintain a running count as ID

// task and task list manipulation
const newTask = (text) => {
    const task = {
        id :  nextID,
        done: false,
        text
    }
    tasks.unshift(task);

    nextID++;
    updateLocalStorage();
    return task;
};

// dom manipulations
const addDomTask = (task) => {
    const listEl = document.querySelector('#task-list');

    const taskEl = document.createElement('div');
    taskEl.classList = (task.done)? ['task done'] : ['task'];
    taskEl.id = task.id;
    taskEl.innerHTML = 
       `<p class="task-text">This is a dummy task.</p>
        <input class="task-edit hide" type="text">
        <div class="task-controls">
            <button class="btn-edit-task">&#8634;</button>
            <button class="btn-delete-task">&times;</button>
        <div class="task-controls">`

    taskEl.firstChild.textContent = task.text;
    taskEl.addEventListener('click', handleTaskClick);
    
    listEl.insertBefore(taskEl, listEl.firstChild);
}

const updateDomTask = (taskEl, task) => {
    const pEl = taskEl.firstChild;
    if (pEl.textContent !== task.text) pEl.textContent = task.text;
    
    // only update, if they don't share the same value
    const elDone = taskEl.classList.contains('done');
    if (task.done ? !elDone : elDone) taskEl.classList.toggle('done', task.done);
};

const removeDomTask = (taskEl) => {
    taskEl.removeEventListener('click', handleTaskClick);
    taskEl.remove();
}

const enterDomTaskEditMode = (taskEl, task) => {
    const pEl     = taskEl.firstChild;
    const inputEl = taskEl.children[1];

    if (inputEl.classList.contains('hide')) {
        const width = pEl.offsetWidth;
        
        inputEl.style.width = `${width}px`;
        inputEl.value = task.text;
        
        //switch out boxes
        pEl.classList.toggle('hide');
        inputEl.classList.toggle('hide');
        inputEl.focus();
        
        inputEl.addEventListener('change', handleTaskEdit);
        inputEl.addEventListener('blur', handleTaskEdit);
        taskEl.removeEventListener('click', handleTaskClick);
    }
}

const exitDomTaskEditMode = (taskEl) => {
    const inputEl = taskEl.children[1];
    const paraEl  = taskEl.firstChild;

    inputEl.removeEventListener('change', handleTaskEdit);
    inputEl.removeEventListener('blur', handleTaskEdit);
    // (Janky!) The timeout, prevents clicking outside of input from triggering new immediate event.
    setTimeout(() => {taskEl.addEventListener('click', handleTaskClick);}, 250)
    
    paraEl.classList.toggle('hide');
    inputEl.classList.toggle('hide');
}    


// handlers (half-breeds)

/**
 * Task click event handler.
 * Handles checking (done), triggering edits and deleting.
 */
const handleTaskClick = (event) => {
    const taskEl = event.currentTarget;
    const index = tasks.findIndex((t) => t.id == taskEl.id);
    const task  = tasks[index];

    const targetClassList = event.target.classList;

    //short-circuit click in edit box - as we don't want to trigger a mark done
    if (targetClassList.contains('task-edit')) {
        return;
    }

    //check for delete
    if (targetClassList.contains('btn-delete-task')) {
        tasks = [...tasks.slice(0,index), ...tasks.slice(index+1)];
        removeDomTask(taskEl);
        updateLocalStorage()
        return;
    }

    // start editing a task
    if (targetClassList.contains('btn-edit-task')) {
        enterDomTaskEditMode(taskEl, task)
        return;
    }

    //else toggle 'done' state of task
    task.done = !task.done;
    updateDomTask(taskEl, task);
    updateLocalStorage()
};

/**
 * Handles edits on a task
 * 
 */
const handleTaskEdit = (event) => {
    const inputEl = event.currentTarget;
    const taskEl  = inputEl.parentElement;
    const task = tasks.find(t => t.id == taskEl.id);
    
    if (task.text != inputEl.value) {
        task.text = inputEl.value;
        task.done = false;
        updateDomTask(taskEl, task);
        updateLocalStorage();
    }   
    exitDomTaskEditMode(taskEl);
}

// pushed program state to local storage, this allows lists - etc, to be stored between sessions
const updateLocalStorage = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

const restoreFromStorage = () => {
    const storedTasks = JSON.parse(localStorage.getItem('tasks'));

    if (storedTasks) {
        storedTasks.reverse().forEach((task) => {
            tasks.unshift(task);
            addDomTask(task);
            nextID = Math.max(nextID, task.id);
        })
    }
}

/**
 * Register handler and connect up the application
 */
document.addEventListener('DOMContentLoaded', () => {
    const form  = document.querySelector('#task-form');
    const input = document.querySelector('#task-input');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (input.value == '') return;

        addDomTask(newTask(input.value));
        input.value = '';
    })
    
    // poll local storage
    restoreFromStorage();

    // input for testing if none-exists
    if (tasks.length == 0) {
        addDomTask(newTask('hello'));
        addDomTask(newTask('a longer task'));
        addDomTask(newTask('bye'));
    }
    
    // set focus to input by default
    input.focus();
});