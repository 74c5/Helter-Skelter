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
    tasks.push(task);

    nextID++;
    updateLocalStorage();
    return task;
};

// dom manipulations
const addDomTask = (task) => {
    const listEl = document.querySelector('#task-list');

    const taskEl = document.createElement('div');
    taskEl.classList.toggle('task', true);
    taskEl.classList.toggle('done', task.done);
    taskEl.id = `task-${task.id}`;
    taskEl.innerHTML = 
       `<p class="task-text">This is a dummy task.</p>
        <input class="task-edit invisible hidden" type="text">
        <div class="task-controls">
            <button class="btn-edit-task">&#8634;</button>
            <button class="btn-delete-task">&times;</button>
        <div class="task-controls">`

    taskEl.firstChild.textContent = task.text;
    taskEl.addEventListener('click', handleTaskClick);
    
    listEl.insertBefore(taskEl, listEl.firstChild);
    setTimeout(() => {
        taskEl.classList.toggle('show')
    }, 10);
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
    taskEl.classList.toggle('show')
    setTimeout(() => taskEl.remove(), 1000);
}

const enterDomTaskEditMode = (taskEl, task) => {
    console.log(`enter edit mode? ${task.id}: ${task.text}`);
    const pEl     = taskEl.firstChild;
    const inputEl = taskEl.children[1];

    if (inputEl.classList.contains('hidden')) { //todo: shouldn't need this...
        const width = pEl.offsetWidth;
        
        inputEl.style.width = `${width}px`;
        inputEl.value = task.text;

        // switch event handlers
        inputEl.addEventListener('change', handleTaskEdit);
        inputEl.addEventListener('blur', handleTaskEdit);
        taskEl.removeEventListener('click', handleTaskClick);

        //switch out boxes
        pEl.classList.toggle('hidden');
        inputEl.classList.toggle('hidden');
        setTimeout( () => {
            pEl.classList.toggle('invisible');
            inputEl.classList.toggle('invisible');
            inputEl.focus();
        }, 10); // removing display: none requires a small timeout
    }
}

const exitDomTaskEditMode = (taskEl) => {
    const inputEl = taskEl.children[1];
    const pEl     = taskEl.firstChild;

    inputEl.removeEventListener('change', handleTaskEdit);
    inputEl.removeEventListener('blur', handleTaskEdit);
    // (Janky!) The timeout, prevents clicking outside of input from triggering new immediate event.
    setTimeout(() => {taskEl.addEventListener('click', handleTaskClick);}, 250)
    
    pEl.classList.toggle('hidden');
    inputEl.classList.toggle('hidden');
    setTimeout( () => {
        pEl.classList.toggle('invisible');
        inputEl.classList.toggle('invisible');
    }, 10); // removing display: none requires a small timeout
};

// written this way to allow for animations...
const reloadDomTasks = () => {
    if (tasks.length == 0) return;

    const queue = [];

    tasks.forEach(task => {
        const taskEl = document.querySelector(`#task-${task.id}`);
        if (taskEl) queue.push(() => {removeDomTask(taskEl);} );
        queue.push(() => {addDomTask(task);} );
    })

    const offset = 600; //animation offset
    queue.forEach( (cb, i) => setTimeout(cb, offset*i));
};

// handlers (half-breeds)

/**
 * Task click event handler.
 * Handles checking (done), triggering edits and deleting.
 */
const handleTaskClick = (event) => {
    const taskEl = event.currentTarget;
    const index = tasks.findIndex((t) => t.id == taskEl.id.slice(5));
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

const handleRandomizeClick = (event) => {
    let copy = [...tasks];
    const result = [];

    while (copy.length > 0) {
        const index = Math.floor(Math.random()*copy.length);
        result.push(copy[index])
        copy = [...copy.slice(0,index), ...copy.slice(index+1)];
    }

    tasks = result
    reloadDomTasks();
};

/**
 * Handles edits on a task
 * 
 */
const handleTaskEdit = (event) => {
    const inputEl = event.currentTarget;
    const taskEl  = inputEl.parentElement;
    const task = tasks.find(t => t.id == taskEl.id.slice(5));
    
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
        storedTasks.forEach( t => {
            tasks.push(t) 
            nextID = Math.max(nextID, t.id) + 1;
        });
        reloadDomTasks();
    }
}

/**
 * Register handler and connect up the application
 */
document.addEventListener('DOMContentLoaded', () => {
    const form  = document.querySelector('#task-form');
    const input = document.querySelector('#task-input');
    
    form.addEventListener('submit', (event) => {
        event.stopPropagation();
        event.preventDefault();
        
        if (input.value == '') return;
        
        addDomTask(newTask(input.value));
        input.value = '';
    })
    
    const randomBtn = document.querySelector('#btn-randomize');
    randomBtn.addEventListener('click', handleRandomizeClick);

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