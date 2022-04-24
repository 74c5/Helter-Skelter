// initialise with an array of task data
export const create = () => {
    /* private state */
    const callbacks = {
        update : undefined,
    }
    let list   = []
    let nextID = 1;

    /* functions */
    const initialise = (tasks, {updateCB}) => {
        list   = tasks;
        nextID = (list.length > 0)? Math.max(...list.map(t => t.id.slice(5))) + 1 : 1;
        callbacks.update = updateCB;
        callbacks.update(list);
    }

    const add = (value) => {
        for (const val of value.split(';')) {
            list.push({id : `task-${nextID}`, isDone: false, value: val});
            nextID++;
        }
        callbacks.update(list)
    };

    const remove = (id) => {
        const index = list.findIndex( t => t.id == id );
        list = [...list.slice(0,index), ...list.slice(index+1)];
        callbacks.update(list)
    };

    const setValue = ({id, value}) => {
        const task = list.find( t => t.id == id);
        task.value  = value;
        task.isDone = false; // modified tasks are incomplete
        callbacks.update(list)
    }

    const toggleDone = (id) => {
        const task = list.find( t => t.id == id);
        task.isDone = !task.isDone;
        callbacks.update(list)
    };

    const move = ({id, beforeId}) => {
        const tI = list.findIndex(t => t.id == id);
        const bI = list.findIndex(t => t.id == beforeId);
        const nI = (bI < 0)? list.length - 1 : (tI < bI)? bI - 1 : bI;

        if (nI != tI) { 
            // new index and current task index are different => move the task
            const task = list[tI];
            list = [...list.slice(0,tI), ...list.slice(tI+1)];  // remove task from list
            list.splice(nI, 0, task);                           // re-add at new index
            callbacks.update(list)
        }

    };

    const sort = () => {
        const sorted = [
            ...list.filter( t => !t.isDone ),
            ...list.filter( t => t.isDone )
        ];
        let changed = !sorted.every( (v, i) => v === list[i] );
        if (changed) {
            list = sorted;
            callbacks.update(list)
        }
    }

    const randomise = () => {
        // 1. sort into todo and done    
        let   todo = [...list.filter( t => !t.isDone )];
        const done = [...list.filter( t => t.isDone )];

        // 2. remove todo in random order and push onto shuffle
        let shuffle = [];
        while (todo.length > 0) {
            const index = Math.floor(Math.random()*todo.length);
            // this isn't very efficient... but we're only working with small arrays...
            shuffle.push(todo[index])
            todo = [...todo.slice(0,index), ...todo.slice(index+1)];
        }
        shuffle = [...shuffle, ...done];

        // 3. if updated then store changes
        let changed = !shuffle.every( (v, i) => v === list[i] );
        if (changed) {
            list = shuffle;
            callbacks.update(list);
        }
    }

    /* public interface */
    return {
        add,                // args: value
        setValue,           // args: {id, value}
        get : () => [...list],  // temp...
        initialise,         // args [...tasks], {updateCB}
        move,               // args: {id, value}
        remove,             // args: id
        toggleDone,         // args: id
        sort,
        randomise
    }
}
