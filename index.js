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
const createDomTask = (task) => {
    const taskEl = document.createElement('div');
    taskEl.id = `task-${task.id}`;
    taskEl.classList.add('task');
    taskEl.classList.toggle('done', task.done);
    taskEl.draggable = true;
    taskEl.innerHTML = 
       `<div class="grabber-task"><span>&#10495;</span></div>
        <!-- &#10495; or &#10303; or &#10240; -->
        <div class="text-task">This is a dummy task.</div>
        <input class="input-edit-task invisible hidden" type="text">
        <div class="controls-task">
            <button class="btn-edit-task"><span>&#10226;</span></button>
            <!-- &#10226; or &#8634; -->
            <button class="btn-delete-task"><span>&times;</span></button>
        </div>`

    taskEl.querySelector('.text-task').textContent = task.text;
    taskEl.addEventListener('click', handleTaskClick);
    taskEl.addEventListener('dragstart', handleTaskDragStart);
    taskEl.addEventListener('dragend', handleTaskDragEnd);

    return taskEl;
};

const insertDomTask = (taskEl, beforeEl = null) => {
    const listEl = document.querySelector('#list-tasks');

    listEl.insertBefore(taskEl, beforeEl);
    setTimeout(() => {
        taskEl.classList.add('show')
    }, 10);
}

const updateDomTask = (taskEl, task) => {
    const pEl = taskEl.querySelector('.text-task');
    if (pEl.textContent !== task.text) pEl.textContent = task.text;
    
    // mirror task done state
    taskEl.classList.toggle('done', task.done);
};

const removeDomTask = (taskEl) => {
    taskEl.classList.toggle('show')
}

const destroyDomTask = (taskEl) => {
    taskEl.removeEventListener('click', handleTaskClick);
    taskEl.removeEventListener('dragstart', handleTaskDragStart);
    taskEl.removeEventListener('dragend', handleTaskDragEnd);
    taskEl.remove();
}

const enterDomTaskEditMode = (taskEl, task) => {
    const pEl     = taskEl.querySelector('.text-task');
    const inputEl = taskEl.querySelector('.input-edit-task');

    if (inputEl.classList.contains('hidden')) { //todo: shouldn't need this...
        const width = pEl.offsetWidth;
        
        inputEl.style.width = `${width}px`;
        inputEl.value = task.text;

        // switch event handlers
        inputEl.addEventListener('change', handleTaskEdit);
        inputEl.addEventListener('blur', handleTaskEdit);
        taskEl.removeEventListener('click', handleTaskClick);

        //switch out boxes
        pEl.classList.add('hidden');
        inputEl.classList.remove('hidden');
        setTimeout( () => {
            pEl.classList.add('invisible');
            inputEl.classList.remove('invisible');
            inputEl.focus();
        }, 10); // removing display: none requires a small timeout
    }
}

const exitDomTaskEditMode = (taskEl) => {
    const pEl     = taskEl.querySelector('.text-task');
    const inputEl = taskEl.querySelector('.input-edit-task');

    inputEl.removeEventListener('change', handleTaskEdit);
    inputEl.removeEventListener('blur', handleTaskEdit);
    // (Janky!) The timeout, prevents clicking outside of input from triggering new immediate event.
    setTimeout(() => {taskEl.addEventListener('click', handleTaskClick);}, 250)
    
    pEl.classList.remove('hidden');
    inputEl.classList.add('hidden');
    setTimeout( () => {
        pEl.classList.remove('invisible');
        inputEl.classList.add('invisible');
    }, 10); // removing display: none requires a small timeout
};

// written this way to allow for animations...
const reloadDomTasks = (list) => {
    if (list.length == 0) return;

    const queue = [];

    // remove items from list in reverse current order
    const domList = [...document.querySelector('#list-tasks').children].reverse();
    let beforeEl = null;
    domList.forEach( tEl => {
        if (list.findIndex(t => t.id == tEl.id.slice(5)) >= 0) {
            queue.push( () => {removeDomTask( tEl ); } );
        } else {
            beforeEl = tEl;
        }
    });
        
    // re-add in new order
    list.forEach( t => { 
        const taskEl = domList.find( tEl => t.id == tEl.id.slice(5) );
        if ( taskEl ) {
            queue.push(() => { insertDomTask(taskEl, beforeEl); }); 

        } else { 
            // recreate tasks, first
            queue.push(() => { insertDomTask(createDomTask(t), beforeEl); });
        }
    });

    const offset = 500; //animation offset
    queue.forEach( (cb, i) => setTimeout(cb, offset*i));
};

const previewTaskInsert = (beforeEl) => {
    const prevBeforeEl = document.querySelector('.insert-before');
    
    if (beforeEl !== prevBeforeEl) {
        if (beforeEl) beforeEl.classList.add('insert-before');
        if (prevBeforeEl) prevBeforeEl.classList.remove('insert-before');
    }
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

    const targetClassList = (event.target.tagName == 'SPAN')? event.target.parentNode.classList : event.target.classList;
    
    //short-circuit click in edit box - as we don't want to trigger a mark done
    if (targetClassList.contains('task-edit')) {
        return;
    }

    //check for delete
    if (targetClassList.contains('btn-delete-task')) {
        tasks = [...tasks.slice(0,index), ...tasks.slice(index+1)];
        removeDomTask(taskEl);
        destroyDomTask(taskEl);
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

const handleTaskDragStart = (event) => {
    const taskEl = event.currentTarget;
    taskEl.classList.add('dragging');
};

const handleTaskDragEnd = (event) => {
    const taskEl  = event.currentTarget;
    const beforeEl = document.querySelector('.insert-before');
    
    const currentIndex = tasks.findIndex(t => t.id == taskEl.id.slice(5));
    const beforeIndex = (beforeEl)? tasks.findIndex(t => t.id == beforeEl.id.slice(5)) : tasks.length;
    
    if (currentIndex != beforeIndex-1) {
        const task = tasks[currentIndex];
        const newIndex = (currentIndex < beforeIndex)? beforeIndex-1 : beforeIndex;

        //update task lits
        tasks = [...tasks.slice(0,currentIndex), ...tasks.slice(currentIndex+1)]
        tasks.splice(newIndex, 0, task);
        
        removeDomTask(taskEl);
        setTimeout(() => {
            insertDomTask(taskEl, beforeEl)
        }, 500);
        updateLocalStorage();
    }

    if (beforeEl) beforeEl.classList.remove('insert-before');
    taskEl.classList.remove('dragging');
};

const handleRandomizeClick = (event) => {
    let [done, todo] = tasks.reduce(([d,td], t) => {
        (t.done)? d.push(t) : td.push(t);
        return [d,td];
    }, [[],[]]);

    const result = [];

    //this isn't very efficient... but we're only working with small arrays...
    while (todo.length > 0) {
        const index = Math.floor(Math.random()*todo.length);
        result.push(todo[index])
        todo = [...todo.slice(0,index), ...todo.slice(index+1)];
    }

    tasks = [...result, ...done];
    updateLocalStorage();
    reloadDomTasks(result);
};

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

const handleListDragOver = (event) => {
    event.preventDefault();

    const listEl = event.currentTarget;
    const taskElList = [...listEl.querySelectorAll('.task:not(.dragging)')];
    
    const y = event.clientY;

    //finds two elements that the task is dragged between
    const before = taskElList.reduce( (acc, el) => {
        const box = el.getBoundingClientRect();
        const dist = y - box.y - box.height / 2;

        // cursor is above the element
        if (dist <= 0 && dist > acc.dist) acc = {el, dist};
        
        return acc;

    }, { el: null, dist: Number.NEGATIVE_INFINITY} );

    const beforeEl = before.el;
    
    previewTaskInsert(beforeEl);
};

const handleHelpClick = (event) => {
    const modal = document.querySelector('#modal-help');

    if (modal.classList.contains('off-screen-left')) {
        // show the modal
        modal.classList.remove('off-screen-left');  // remove the class
        modal.addEventListener('click', handleHelpClick); // re-trigger for click anywhere on screen
    } else {
        // hide the modal
        modal.classList.add('off-screen-left');  // re-add the class
        modal.removeEventListener('click', handleHelpClick); // remove modal level trigger
    }
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
        reloadDomTasks(tasks);
    }
}

/**
 * Register handler and connect up the application
 */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('#input-new-task');
    
    input.addEventListener('change', (event) => {
        event.stopPropagation();
        event.preventDefault();
        
        if (input.value == '') return;
        
        const taskEl = createDomTask(newTask(input.value));
        insertDomTask(taskEl);
        input.value = '';
    })
    
    const list = document.querySelector('#list-tasks');
    list.addEventListener('dragover', handleListDragOver);

    const randomBtn = document.querySelector('#btn-randomize');
    randomBtn.addEventListener('click', handleRandomizeClick);

    const helpBtn = document.querySelector('#btn-help');
    helpBtn.addEventListener('click', handleHelpClick);

    // poll local storage
    restoreFromStorage();

    // set focus to input by default
    input.focus();
});

//debug...
const addTestTasks = () => {
    insertDomTask(createDomTask(newTask('one: hello')));
    insertDomTask(createDomTask(newTask('two: a longer task')));
    insertDomTask(createDomTask(newTask('three: bye')));
}