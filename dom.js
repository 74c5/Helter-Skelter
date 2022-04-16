import * as list from "./List.js";

// interface constants
export const TASK_ACTION = Object.freeze({
    EDIT        : 'edit',   
    DELETE      : 'delete',  
    MARK        : 'mark'            // mark/unmark isDone
});

// internal constants
const ANIMATION = Object.freeze({
    SHORT_DELAY : 10,   // pause required for dom change to register, before applying additional classes, etc.
    CYCLE_DELAY : 500,  // pause required for full transition
    INPUT_DELAY : 250   // delay additional input on component following a change of state
});

// internal state
const handlers = {
    onNewTask        : null,
    onClickTask      : null,
    onDragStartTask  : null,
    onDragEndTask    : null,
    onDragOverList   : null,
    onChangeTaskEdit : null,
    onClickRandomize : null,
    onClickHelp      : null
};

// linked (type) list which mirrors dom elements
let domList = list.create();

/**
 * Takes list of objects in form [{id, value, isDone}, ...]
 * and synchronises with internal list and updates the dom
 */
export const updateTasks = (tasks) => {
    const queue = [];

    const taskList = list.create(tasks.map( t => list.node(t) ));
// console.log('updateTasks');
// console.log('dom: ' + domList.toString('id'));
// console.log('input: ' + taskList.toString('id'));

    // handle deleted tasks
    const removes = [];
    let dn = domList.first();
    while (dn) {
        if ( !taskList.find(dn.id) ) {
            domList.remove(dn);
            removes.push(dn.el);
        }
        dn = dn.next;
    }
    
    // handle inserts and modifications
    const modifications = [];
    const additions = [];
    
    let tn = taskList.first();
    while (tn) {
        dn = domList.find(tn.id);
        if (dn) { // check for changes
            if ( tn.value != dn.value || tn.isDone != dn.isDone ) {
                dn.value  = tn.value;
                dn.isDone = tn.isDone;
                modifications.push({el: dn.el, value: dn.value, isDone: dn.isDone})
            }
        } else { // this is a new task - push onto end of dom list
            dn = list.node({...tn, el: createTask(tn)});
            domList.append(dn);
            additions.push(dn.el);
        }
        tn = tn.next;
    };
    
    // handle moved tasks
    const moves = [];
    const shuffles = new Map();
    
    // taskList and domList should now match in length... 
    // identify initial list of task which will NOT shift in position
    tn = taskList.first();
    dn = domList.first();
    while (dn) {
        shuffles.set(dn.id, dn.id != tn.id); // set true if same task
        tn = tn.next;
        dn = dn.next;
    };
    const updateShuffles = () => {
        let tn = taskList.first(); // use local
        let dn = domList.first();  // use local
        while (dn) {
            // set true if these are still the same task
            shuffles.set(dn.id, shuffles.get(dn.id) || dn.id != tn.id);
            tn = tn.next;
            dn = dn.next;
        };
    }
    // then shuffle the dom to match the input list
    tn = taskList.first();
    dn = domList.first();
    while (dn) {
        if (dn.id == tn.id) {
            dn = dn.next;
            tn = tn.next;
            continue;
        }

        // an element should be moved
        const dnitl = taskList.find(dn.id);
        
        if (dn.next?.id == dnitl.next?.id) {   
            // current dom element is in correct relative position
            // so move tn to this position in the dom
            const temp = domList.find(tn.id);
            domList.remove(temp)
            domList.insert(temp, dn);
// console.log(`move tn ${tn.id} here ${dn.id}: ` + domList.toString('id'))
            moves.push({el: temp.el, prev: temp.prev?.el, next: temp.next?.el});
            dn = temp;
        } else {          
            // current dom element must move (down list)
            const temp = dn.next;
            domList.remove(dn);
            domList.insert(dn, domList.find(dnitl.next?.id));
// console.log(`move ${dn.id} down to before ${domList.find(dnitl.next?.id)?.id}: ` + domList.toString('id'))
            moves.push({el: dn.el, prev: dn.prev?.el, next: dn.next?.el});
            dn = temp;
        }
        updateShuffles();
    };

// console.log('actions')
// console.log('new dom ' + domList.toString('id'));
// console.log(removes.map( el => el.id ));
// console.table(modifications);
// console.log(additions.map( el => el.id ));
// console.log(shuffles);
// console.table(moves);

    if (removes.length > 0)       queue.push(...removeTasks(removes));
    if (modifications.length > 0) queue.push(...changeTasks(modifications));
    if (additions.length > 0)     queue.push(...appendTasks(additions));
    if (moves.length > 0)         queue.push(...moveTasks(moves, shuffles));

// console.log('queuing update')
// console.table(queue);
    animateQueue(queue);    
}


const createTask = ({id, value, isDone}) => {
    const task = document.createElement('div');
    task.id = id;
    task.classList.add('task');
    task.classList.add('hidden');
    task.classList.add('shrunk');
    task.classList.toggle('done', isDone);
    task.draggable = true;
    task.innerHTML = 
       `<div class="grabber-task"><span>&#10495;</span></div>
        <!-- &#10495; or &#10303; or &#10240; -->
        <div class="text-task">This is a dummy task.</div>
        <input class="input-edit-task hidden removed" type="text">
        <div class="controls-task">
            <button class="btn-edit-task"><span>&#10226;</span></button>
            <!-- &#10226; or &#8634; -->
            <button class="btn-delete-task"><span>&times;</span></button>
        </div>`

    task.querySelector('.text-task').textContent = value;
    task.addEventListener('click', handlers.onClickTask);
    task.addEventListener('dragstart', handlers.onDragStartTask);
    task.addEventListener('dragend', handlers.onDragEndTask);

    return task;
};

const removeTasks = (removes) => {
    const queue = [
        {
            action: () => { removes.forEach( el => { el.classList.add('hidden'); }) },
            delay : ANIMATION.CYCLE_DELAY
        },{
            action: () => { removes.forEach( el => { el.classList.add('shrunk'); }) },
            delay : ANIMATION.CYCLE_DELAY
        },{
            action : () => {
                removes.forEach( el => {
                    // console.log(`removing ${rem.id}`)
                    el.removeEventListener('click', handlers.onClickTask);
                    el.removeEventListener('dragstart', handlers.onDragStartTask);
                    el.removeEventListener('dragend', handlers.onDragEndTask);
                    el.remove();
                });
            },
            delay : ANIMATION.SHORT_DELAY
        }
    ];
// console.table(queue);
    return queue;
};

const changeTasks = (changes) => {
    const queue = [
        {
            action : () => {
                changes.forEach( ({el, value, isDone}) => {
                    // console.log(`changing ${el.id}`)
                    el.querySelector('.text-task').textContent = value;
                    el.classList.toggle('done', isDone);
                    el.classList.add('highlight');
                });
            },
            delay : ANIMATION.CYCLE_DELAY
        },{
            action: () => { changes.forEach( ({el}) => { el.classList.remove('highlight'); }) },
            delay : ANIMATION.CYCLE_DELAY
        }
    ];
    return queue;
};

const appendTasks = (additions) => {
    const listEl = document.querySelector('#list-tasks');
    
    const queue = [
        {
            action : () => { additions.forEach( (el) => { listEl.appendChild(el); }); },
            delay  : ANIMATION.SHORT_DELAY
        },{
            action : () => { additions.forEach( el => { el.classList.remove('shrunk'); }) },
            delay  : ANIMATION.CYCLE_DELAY
        },{
            action : () => { additions.forEach( el => { el.classList.remove('hidden'); }) },
            delay  : ANIMATION.CYCLE_DELAY
        }
    ];

    return queue;
};


const moveTasks = (moves, shuffles) => {
    const listEl = document.querySelector('#list-tasks');

    const queue = [
        {
            action : () => { 
                let dn = domList.first()
                while (dn) {
                    if (shuffles.get(dn.id)) dn.el.classList.add('hidden');
                    dn = dn.next;
                }
            },
            delay  : ANIMATION.CYCLE_DELAY
        }, {
            action: () => { 
                moves.forEach( ({el, prev, next}) => {
                    el.remove();
                    if (next) next.before(el)
                    else prev.after(el);
                }); 
            },
            delay : ANIMATION.SHORT_DELAY
        }, {
            action : () => { 
                let dn = domList.first()
                while (dn) {
                    if (shuffles.get(dn.id)) dn.el.classList.remove('hidden');
                    dn = dn.next;
                }
            },
            delay  : ANIMATION.CYCLE_DELAY
        }
    ];

    return queue;
}

export const startTaskEdit = (event, value) => {
    const task  = event.currentTarget;
    const text  = task.querySelector('.text-task');
    const input = task.querySelector('.input-edit-task');

    const width = text.offsetWidth;
    input.style.width = `${width}px`;

    input.value = value;

    // switch event handlers
    input.addEventListener('change', handlers.onChangeTaskEdit);
    input.addEventListener('blur', handlers.onChangeTaskEdit);
    task.removeEventListener('click', handlers.onClickTask);

    //switch out boxes
    const queue = [
        { action: () => { text.classList.add('removed');
                          input.classList.remove('removed'); },
          delay : ANIMATION.SHORT_DELAY
        }, {
          action : () => { text.classList.add('hidden');
                           input.classList.remove('hidden');
                           input.focus(); },
          delay  : ANIMATION.SHORT_DELAY
        }
    ];
    animateQueue(queue);
}

export const endTaskEdit = (event) => {
    const input = event.currentTarget;
    const task  = input.parentElement;
    const text  = task.querySelector('.text-task');
    const id    = task.id;

    input.removeEventListener('change', handlers.onChangeTaskEdit);
    input.removeEventListener('blur', handlers.onChangeTaskEdit);
    // The timeout, prevents clicking outside of input from triggering new immediate event. (not ideal, but works)
    setTimeout(() => {task.addEventListener('click', handlers.onClickTask);}, ANIMATION.INPUT_DELAY)
    
    const queue = [
        {
            action : () => { text.classList.remove('removed');
                             input.classList.add('removed'); },
            delay  : ANIMATION.SHORT_DELAY
        },{
            action : () => { text.classList.remove('hidden');
                             input.classList.add('hidden');  },
            delay  : ANIMATION.SHORT_DELAY
        }
        
    ];
    animateQueue(queue);

    return {id, value: input.value}
};

export const getClickTaskAction = (event) => {
    const result = {
        action : TASK_ACTION.MARK,        // default
        id     : event.currentTarget.id
    };

    const targetClassList = (event.target.tagName == 'SPAN')? event.target.parentNode.classList : event.target.classList;
    
    if (targetClassList.contains('btn-delete-task')) result.action = TASK_ACTION.DELETE;

    if (targetClassList.contains('btn-edit-task')) result.action = TASK_ACTION.EDIT;

    return result;
}

export const startDrag = (event) => {
    const task = event.currentTarget;
    task.classList.add('dragging');
}

export const endDrag = (event) => {
    const task   = event.currentTarget;
    const result = {
        id : task.id,
        beforeId : ""       // default
    }
    
    task.classList.remove('dragging');

    const before = document.querySelector('.insert-before');
    if (before) {
        before.classList.remove('insert-before');
        result.beforeId = before.id;
    }

    return result;
};

//todo: debounce this...
export const previewDrag = (event) => {
    event.preventDefault();

    const y = event.y;
    //find closest element below the drag point (y)
    let before;
    let prevBefore;
    let distance = Number.NEGATIVE_INFINITY;
    let dn = domList.first();
    while (dn) {
        // skip the dragged item in the list
        if (!dn.el.classList.contains("dragging")) {
            const box  = dn.el.getBoundingClientRect();
            const temp = y - box.y - box.height / 2;
            // cursor is above the element
            if (temp <= 0 && temp > distance) {
                distance = temp;
                before = dn;
            }
        }
        // store previous before element
        if (dn.el.classList.contains("insert-before") ) prevBefore = dn;
        dn = dn.next;
    }
    if (before?.id != prevBefore?.id) {
        if (before) before.el.classList.add('insert-before');
        if (prevBefore) prevBefore.el.classList.remove('insert-before');
    }
}

export const showHelpModal = () => {
    const modal = document.querySelector('#modal-help');

    if (modal.classList.contains('off-screen-left')) {
        // show the modal
        modal.classList.remove('off-screen-left');  // remove the class
        modal.addEventListener('click', showHelpModal); // re-trigger for click anywhere on screen
    } else {
        // hide the modal
        modal.classList.add('off-screen-left');  // re-add the class
        modal.removeEventListener('click', showHelpModal); // remove modal level trigger
    }
}

export const getAndClearTaskInput = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const value = event.currentTarget.value;

    event.currentTarget.value = '';
    return value;
}

export const setHandlers = ({onNewTask, onClickTask, onDragStartTask, onDragStartEnd, onDragOverList, onChangeTaskEdit, onClickRandomize, onClickHelp}) => {
    // set handlers
    handlers.onNewTask        = onNewTask;
    handlers.onClickTask      = onClickTask;
    handlers.onDragStartTask  = onDragStartTask;
    handlers.onDragEndTask    = onDragStartEnd;
    handlers.onDragOverList   = onDragOverList;
    handlers.onChangeTaskEdit = onChangeTaskEdit;
    handlers.onClickRandomize = onClickRandomize;
    handlers.onClickHelp      = onClickHelp;

    // setup introductory offers
    const input = document.querySelector('#input-new-task');
    input.addEventListener('change', onNewTask);
    
    const list = document.querySelector('#list-tasks');
    list.addEventListener('dragover', onDragOverList);
    
    const randomBtn = document.querySelector('#btn-randomize');
    randomBtn.addEventListener('click', onClickRandomize);
    
    const helpBtn = document.querySelector('#btn-help');
    helpBtn.addEventListener('click', onClickHelp);
};

export const setFocusToNewInput = () => {
    const input = document.querySelector('#input-new-task');
    input.focus();
}

// queue is an array of objects of form {action, delay}, where action is function and delay is the delay before the next function
const animateQueue = (queue) => {
    if (queue.length == 0) return;
    // perform the the current function in the queue
    const {action, delay} = queue.shift();
    action();
    // schedule the next function
    setTimeout( () => { animateQueue(queue) }, delay );
}
