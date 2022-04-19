import * as List from "./List.js";
import * as Utils from "./Utils.js";

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

export const create = ({onNewTask, onClickTask, onDragEndTask, onChangeTaskEdit, onClickRandomize, onClickHelp}) => {
    /* private internal state */
    const handlers = {
        onNewTask,
        onClickTask,
        onDragEndTask,
        onChangeTaskEdit,
        onClickRandomize,
        onClickHelp
    };
    
    // linked (type) list which mirrors dom elements
    let domList = List.create();
    // dragging variables
    let dragged, before;    
    let isDragging = false;

    const input     = document.querySelector('#input-new-task');
    const list      = document.querySelector('#list-tasks');
    const randomBtn = document.querySelector('#btn-randomize');
    const helpBtn   = document.querySelector('#btn-help');
    
    const initialise = () => {
        // add event listeners
        input.addEventListener('change', handlers.onNewTask);
        list.addEventListener('dragover', onDragUpdate);
        randomBtn.addEventListener('click', handlers.onClickRandomize);
        helpBtn.addEventListener('click', handlers.onClickHelp);
    }

    /**
     * Takes list of objects in form [{id, value, isDone}, ...]
     * and synchronises with internal list and updates the dom
     */
    const update = (tasks) => {
        const taskList = List.create(tasks.map( t => List.node(t) ));
        const queue = [];

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
        
        // identify inserts and modifications
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
                const taskEl = createTask(tn, handlers.onClickTask, onDragStart, handlers.onDragEndTask)
                dn = List.node({...tn, el: taskEl});
                domList.append(dn);
                additions.push(dn.el);
            }
            tn = tn.next;
        };
        
        // handle moved tasks
        const shuffles = [];
        const moves = [];
        
        // taskList and domList should now match in length... 
        // identify initial list of tasks which will shift in position
        tn = taskList.first();
        dn = domList.first();
        while (dn) {
            if (dn.id != tn.id) moves.push(dn.el);
            tn = tn.next;
            dn = dn.next;
        };

        // then shuffle the dom to match the input list
        tn = taskList.first();
        dn = domList.first();
        while (dn) {
            if (dn.id == tn.id) { // skip this step when id's match
                dn = dn.next;
                tn = tn.next;
                continue;
            }

            // an element should be moved
            const ref = taskList.find(dn.id);
            
            if (dn.next?.id == ref.next?.id) {  // current dom element is in correct relative position
                // so move tn to this position in the dom
                const temp = domList.find(tn.id);
                domList.remove(temp)
                domList.insert(temp, dn);
                shuffles.push({el: temp.el, next: temp.next?.el, prev: temp.prev?.el});
                dn = temp;
            } else {          
                // move current dom element down the list
                const temp = dn.next;
                domList.remove(dn);
                domList.insert(dn, domList.find(ref.next?.id));
                shuffles.push({el: dn.el, next: dn.next?.el, prev: dn.prev?.el});
                dn = temp;
            }
            // update the moves list
            let ddn = dn;
            let ttn = tn;
            while (ddn) {
                if (ddn.id != ttn.id && !moves.includes(ddn.el)) moves.push(ddn.el);
                ttn = ttn.next;
                ddn = ddn.next;
            };
        };

        if (removes.length > 0)       queue.push(...createRemoveQueue(removes, handlers.onClick, onDragStart, handlers.onDragEndTask));
        if (modifications.length > 0) queue.push(...createModificationQueue(modifications));
        if (additions.length > 0)     queue.push(...createAppendQueue(additions));
        if (shuffles.length > 0)      queue.push(...createMoveQueue(shuffles, moves));

        animateQueue(queue);    
    }

    const onDragStart = (event) => {
        const task = event.currentTarget;
        isDragging = true;
        dragged = domList.find(task.id);
        if (dragged) {
            dragged.el.classList.add("dragging");
        } else {
            console.error(`Trying to drag task, ${task.id}, which does not exist in dom list`);
        }
    }
    
    const onDragEnd = (event) => {
        isDragging = false;
    
        // clear dragging classes
        dragged.el.classList.remove('dragging');
        if (before) {
            before.el.classList.remove('insert-before');
        }
    
        return {
            moved    : dragged.next != before,
            id       : dragged.id,
            beforeId : before? before.id : ''
        };
    };
    
    // debounced task to update list based on drag location
    const updateDrag = Utils.debounce( (y) => {
        // if dragging is complete, then this is a queued response abort
        if (!isDragging) return;
    
        //find closest element below the drag point (y)
        const prevBefore = before;
        before = undefined;
        let distance = Number.NEGATIVE_INFINITY;
        let dn = domList.first();
        while (dn) {
            if (dn.id != dragged.id) {  // skip the dragged item in the list
                const box  = dn.el.getBoundingClientRect();
                const dist = y - box.y - box.height / 2;
                // cursor is above the element
                if (dist <= 0 && dist > distance) {
                    distance = dist;
                    before = dn;
                }
            }
            dn = dn.next;
        }
    
        if (before?.id != prevBefore?.id) {
            if (before) before.el.classList.add('insert-before');
            if (prevBefore) prevBefore.el.classList.remove('insert-before');
        }
    }, 50);
    
    // drag handler
    const onDragUpdate = (event) => {
        event.preventDefault();
        updateDrag(event.y);
    }

    const startEdit = (event) => {
        const task  = event.currentTarget;
        const text  = task.querySelector('.text-task');
        const input = task.querySelector('.input-edit-task');
    
        const width = text.offsetWidth;
        input.style.width = `${width}px`;
    
        input.value = text.textContent;
    
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
    
    const endEdit = (event) => {
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
        return {id, value: input.value, changed: input.value != text.textContent};
    };
    



    /* public interface */
    return {
        initialise,
        update,
        endDrag    : onDragEnd,
        startEdit,
        endEdit,
        handleDrag : onDragUpdate
    }
}


// utility functions
const createTask = ({id, value, isDone}, onClick, onDragStart, onDragEnd) => {
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
    task.addEventListener('click', onClick);
    task.addEventListener('dragstart', onDragStart);
    task.addEventListener('dragend', onDragEnd);
    
    return task;
};

const createRemoveQueue = (removes, onClick, onDragStart, onDragEnd) => {
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
                    el.removeEventListener('click', onClick);
                    el.removeEventListener('dragstart', onDragStart);
                    el.removeEventListener('dragend', onDragEnd);
                    el.remove();
                });
            },
            delay : ANIMATION.SHORT_DELAY
        }
    ];
    return queue;
};

const createModificationQueue = (modifications) => {
    const queue = [
        {
            action : () => {
                modifications.forEach( ({el, value, isDone}) => {
                    el.querySelector('.text-task').textContent = value;
                    el.classList.toggle('done', isDone);
                    el.classList.add('highlight');
                });
            },
            delay : ANIMATION.CYCLE_DELAY
        },{
            action: () => { modifications.forEach( ({el}) => { el.classList.remove('highlight'); }) },
            delay : ANIMATION.CYCLE_DELAY
        }
    ];
    return queue;
};

const createAppendQueue = (additions) => {
    const listEl = document.querySelector('#list-tasks');
    
    const queue = [
        {
            action : () => { additions.forEach( el => { listEl.appendChild(el); }); },
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


const createMoveQueue = (shuffles, moves) => {
    const queue = [
        {
            action : () => {moves.forEach( el => {el.classList.add('hidden');} )},
            delay  : ANIMATION.CYCLE_DELAY
        }, {
            action: () => { 
                shuffles.forEach( ({el, prev, next}) => {
                    el.remove();
                    if (next) next.before(el)
                    else prev.after(el);
                }); 
            },
            delay : ANIMATION.SHORT_DELAY
        }, {
            action : () => {moves.forEach( el => {el.classList.remove('hidden');} )},
            delay  : ANIMATION.CYCLE_DELAY
        }
    ];

    return queue;
}


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
    isDragging = true;
    dragged = domList.find(task.id);
    if (dragged) {
        dragged.el.classList.add("dragging");
    } else {
        console.error(`Trying to drag task, ${task.id}, which does not exist in dom list`);
    }
}

export const endDrag = (event) => {
    isDragging = false;

    // clear dragging classes
    dragged.el.classList.remove('dragging');
    if (before) {
        before.el.classList.remove('insert-before');
    }

    return {
        moved    : dragged.next != before,
        id       : dragged.id,
        beforeId : before? before.id : ''
    };
};

// debounced task to update list based on drag location
const updateDrag = Utils.debounce( (y) => {
    // if dragging is complete, then this is a queued response abort
    if (!isDragging) return;

    //find closest element below the drag point (y)
    const prevBefore = before;
    before = undefined;
    let distance = Number.NEGATIVE_INFINITY;
    let dn = domList.first();
    while (dn) {
        if (dn.id != dragged.id) {  // skip the dragged item in the list
            const box  = dn.el.getBoundingClientRect();
            const dist = y - box.y - box.height / 2;
            // cursor is above the element
            if (dist <= 0 && dist > distance) {
                distance = dist;
                before = dn;
            }
        }
        dn = dn.next;
    }

    if (before?.id != prevBefore?.id) {
        if (before) before.el.classList.add('insert-before');
        if (prevBefore) prevBefore.el.classList.remove('insert-before');
    }
}, 50);

// drag handler
export const handleDrag = (event) => {
    event.preventDefault();
    updateDrag(event.y);
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
