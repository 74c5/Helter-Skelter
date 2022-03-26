// Program variables
let nextID = 1;         // a bit hacky, but maintain a running count as ID

const addTask = (text, list) => {
    const task = document.createElement('div');
    task.classList = ['task'];
    task.id = nextID;
    task.innerHTML = 
    `<p class="task-text">This is a dummy task.</p>
        <input class="task-edit" type="text">
        <div class="task-controls">
            <button class="btn-edit-task">&#8634;</button>
            <button class="btn-delete-task">&times;</button>
        <div class="task-controls">`

    task.firstChild.textContent = text;
    task.addEventListener('click', handleClick);
    
    list.insertBefore(task, list.firstChild);
    nextID++;
};

/**
 * Task click event handler.
 * Handles checking (done), triggering edits and deleting.
 */
const handleClick = (event) => {
    const task = event.currentTarget;

    //check for delete
    if (event.target.classList.contains('btn-delete-task')) {
        console.log(`delete task ${task.id}: ${task.firstChild.innerContent}`);
        task.removeEventListener('click', handleClick);
        task.remove();
        return;
    }

    //check for edit

    //else toggle 'done' state of task
    event.currentTarget.classList.toggle('done');
};


/**
 * Register handler and connect up the application
 */
document.addEventListener('DOMContentLoaded', () => {
    const form  = document.querySelector('#task-form');
    const input = document.querySelector('#task-input');
    const list  = document.querySelector('#task-list');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (input.value == '') return;
        addTask(input.value, list)
        input.value = '';
    })

    // set focus to input by default
    input.focus();

    // input for testing
    addTask('hello', list);
    addTask('a longer task', list);
    addTask('bye', list);

});