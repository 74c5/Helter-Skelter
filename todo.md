- [x] throttle or debounce on saveTasks and drag?

- refactor
    - [x] Use object factories to hide data
    - [x] completely separate dom (rename UI), data, storage
        - [x] all ui logic in on place
        - [x] TasksUI
            - append further update to queue if queue is already running
        - [x] ControlsUI
        - [x] link accessors and callback handlers? (onX from index) - (semi-pubsub)
            - [x] finish moving dom manipulation outside for TasksUI manager...
    - ?use Lists in data module

## required tweaks

## ideas

- debounce listUI.update

- Separate controls and task list View

- throttle/debounce on update UI? needed? does this make sense...

- responsive design
    - test on small screen

- PWA support

- pending updates flag in data... this can be used to determine if updates to data?
    - or subscribe to changes via... callback pushed to data

- wrap lines for very long tasks

- keyboard controls
- escape -> exits edit mode without altering task
- enter -> with no change, exits edit mode

- hotkeys
- keyboard navigation/selectable tasks

- migrate to indexDB for storing data?

- separate list for done tasks... only on a reload?