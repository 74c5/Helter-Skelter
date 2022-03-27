// Program variables
let nextID = 1;         // a bit hacky, but maintain a running count as ID

const addTask = (text, list) => {
    const task = document.createElement('div');
    task.classList = ['task'];
    task.id = nextID;
    task.innerHTML = 
    `<p class="task-text">This is a dummy task.</p>
        <input class="task-edit hide" type="text">
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

    const targetClassList = event.target.classList;

    //check for click in edit box
    if (targetClassList.contains('task-edit')) {
        console.log('click on edit input');
        return; // do nothing
    }

    //check for delete
    if (targetClassList.contains('btn-delete-task')) {
        task.removeEventListener('click', handleClick);
        task.remove();
        return;
    }

    //check for edit
    if (targetClassList.contains('btn-edit-task')) {
        const para = task.firstChild;
        const input = task.children[1];

        if (input.classList.contains('hide')) {
            const width = para.offsetWidth;
            const text = para.textContent;
            input.value = text;
            input.style.width = `${width}px`;
            
            //switch out boxes
            para.classList.toggle('hide');
            input.classList.toggle('hide');
            input.focus();
            
            input.addEventListener('change', handleEdit);
            input.addEventListener('blur', handleEdit);
            task.removeEventListener('click', handleClick);
        } else {
            console.log('simple transition back... still required?')
        }

        return;
    }

    //else toggle 'done' state of task
    event.currentTarget.classList.toggle('done');
};

/**
 * Handles edits on a task
 * 
 */
const handleEdit = (event) => {
    const input = event.currentTarget;
    const task = input.parentElement;
    const para = task.firstChild;

    if (para.textContent != input.value) {
        para.textContent = input.value;
    }   

    input.removeEventListener('change', handleEdit);
    input.removeEventListener('blur', handleEdit);
    // (Janky!) The timeout, prevents clicking outside of input from triggering new immediate event.
    setTimeout(() => {task.addEventListener('click', handleClick);}, 250)

    para.classList.toggle('hide');
    input.classList.toggle('hide');
}


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