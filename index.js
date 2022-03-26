document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#task-form');
    const task_input = document.querySelector('#task-input');
    const list = document.querySelector('#task-list');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (task_input.value == '') return;

        const task = document.createElement('div');
        task.classList = ['task'];
        task.id = Date.now();
        task.innerHTML = `<p class="task-text">This is a dummy task.</p>
                          <input class="task-edit" type="text">
                          <div class="task-controls">
                            <button class="btn-edit-task">&#8634;</button>
                            <button class="btn-delete-task">&times;</button>
                          <div class="task-controls">`
        task.firstChild.textContent = task_input.value;

        list.insertBefore(task, list.firstChild);

        task_input.value = '';
    })

});

// window.addEventListener('load', () => {
//     console.log('bango');
// });

// console.log('bongo')