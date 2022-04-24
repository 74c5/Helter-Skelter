import * as List from "./List.js";
import * as Utils from "./Utils.js";

// internal constants
const CLICK_ACTION = {
    DELETE: 'delete', 
    EDIT: 'edit', 
    MOVE: 'move'
}

const ANIMATION = Object.freeze({
    SHORT_DELAY : 10,   // pause required for dom change to register, before applying additional classes, etc.
    CYCLE_DELAY : 500,  // pause required for full transition
    INPUT_DELAY : 250   // delay additional input on component following a change of state
});

export const create = () => {
    /* private internal state */
    const handlers = {
        onChange    : undefined,
        onClick     : undefined,
        onDrag      : undefined,
        onDragEnd   : undefined,
        onDragStart : undefined,
    };
    
    // linked (type) list which mirrors dom elements
    let domList = List.create();
    // dragging variables
    let dragged, before;    
    let isDragging = false;
    // animation queue
    const queue = [];

    const list = document.querySelector('#list-tasks');
    
    const initialise = ({moveCB, setValueCB, removeCB, toggleDoneCB}) => {
        handlers.onDragEnd = (event) => {
            isDragging = false;

            endDrag(dragged.el, before?.el)
            
            if (dragged && dragged.next != before) {
                moveCB({id: dragged.id, beforeId: before?.id});
            }
        };

        handlers.onChange = (event) => {
            const {id, textValue, inputValue, queue: nextQueue} = endChange(event, handlers);
            addAnimation(queue,nextQueue);
            if ( inputValue != textValue ) setValueCB({id, value: inputValue});
        }
    
        handlers.onClick = (event) => {
            const {id, action} = getClickAction(event);

            switch (action) {
                case CLICK_ACTION.DELETE: 
                    removeCB(id);
                    return;
                case CLICK_ACTION.EDIT:
                    addAnimation(queue, startEdit(event, handlers));
                    return;
                default:
                    // mark done
                    toggleDoneCB(id);
            }
        };

        handlers.onDragStart = (event) => {
            isDragging = true;
            dragged = domList.find(startDrag(event));
            if (!dragged) {
                console.error(`Trying to drag task, ${task.id}, which does not exist in dom list`);
            }
        }

        // drag handler
        // handlers.onDrag = Utils.debounce( 
        handlers.onDrag = Utils.debounce(50)(({y}) => {
                // ({y}) => {
                if (!isDragging) return; // dragging is complete, abort this queued response

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
                    updateDrag(before?.el, prevBefore?.el);
                }
            }
        );
        // , 50);

    
        // add event listeners
        list.addEventListener('dragover', handlers.onDrag);
    }

    /**
     * Takes list of objects in form [{id, value, isDone}, ...]
     * and synchronises with internal list and updates the dom
     */
    const update = (tasks) => {
        const taskList = List.create(tasks.map( t => List.node(t) ));

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
                const taskEl = createTask(tn, handlers)
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

        if (removes.length > 0)       addAnimation(queue, createRemoveQueue(removes, handlers));
        if (modifications.length > 0) addAnimation(queue, createModificationQueue(modifications));
        if (additions.length > 0)     addAnimation(queue, createAppendQueue(additions));
        if (shuffles.length > 0)      addAnimation(queue, createMoveQueue(shuffles, moves));
    }

    /* public interface */
    return {
        initialise,
        update,
    }
}


// utility functions - contains actual manipulation of DOM
const createTask = ({id, value, isDone}, handlers) => {
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
    task.addEventListener('click', handlers.onClick);
    task.addEventListener('dragstart', handlers.onDragStart);
    task.addEventListener('dragend', handlers.onDragEnd);
    
    return task;
};

const createRemoveQueue = (removes, handlers) => {
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
                    el.removeEventListener('click', handlers.onClick);
                    el.removeEventListener('dragstart', handlers.onDragStart);
                    el.removeEventListener('dragend', handlers.onDragEnd);
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

const startDrag = (event) => {
    return event.currentTarget?.id;
}

const endDrag = (draggedEl, beforeEl) => {
    // clear dragging classes
    draggedEl.classList.remove('dragging');
    if (beforeEl) {
        beforeEl.classList.remove('insert-before');
    }
}

const updateDrag = (beforeEl, prevBeforeEl) => {
    if (beforeEl) beforeEl.classList.add('insert-before');
    if (prevBeforeEl) prevBeforeEl.classList.remove('insert-before');
}

const startEdit = (event, {onChange, onClick}) => {
    const task  = event.currentTarget;
    const text  = task.querySelector('.text-task');
    const input = task.querySelector('.input-edit-task');

    const width = text.offsetWidth;
    input.style.width = `${width}px`;

    input.value = text.textContent;

    // switch event handlers
    input.addEventListener('change', onChange);
    input.addEventListener('blur', onChange);
    task.removeEventListener('click', onClick);

    //switch out boxes
    return [
        { action: () => { text.classList.add('removed');
                          input.classList.remove('removed'); },
          delay : ANIMATION.SHORT_DELAY
        }, {
          action : () => { text.classList.add('hidden');
                           input.classList.remove('hidden');
                           input.focus(); },
          delay  : ANIMATION.SHORT_DELAY
        }
    ];}

const endChange = (event, {onChange, onClick}) => {
    const input = event.currentTarget;
    const task  = input.parentElement;
    const text  = task.querySelector('.text-task');

    input.removeEventListener('change', onChange);
    input.removeEventListener('blur', onChange);
    // The timeout, prevents clicking outside of input from triggering new immediate event. (not ideal, but works)
    setTimeout(() => {task.addEventListener('click', onClick);}, ANIMATION.INPUT_DELAY)
    
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
    return {id: task.id, textValue: text.textContent, inputValue: input.value, queue};
}

const getClickAction = (event) => {
    const id = event.currentTarget.id;
    const classList = (event.target.tagName == 'SPAN')? event.target.parentNode.classList : event.target.classList;
    
    if (classList.contains('btn-delete-task')) return {id, action: CLICK_ACTION.DELETE};
    if (classList.contains('btn-edit-task')) return {id, action: CLICK_ACTION.EDIT};
    return {id, action: CLICK_ACTION.MOVE};
}

// queue is an FIFO objects of form {action, delay}, where action is a function and delay is the wait time before the next function call.
const addAnimation = (queue, next) => {
    queue.push(...next);
    if (queue.length == next.length) animate(queue);
}

const animate = (queue) => {
    if (queue.length == 0) return;
    // perform the the current function in the queue
    const {action, delay} = queue.shift();
    action();
    // schedule the next function
    setTimeout( () => { animate(queue) }, delay );
}
