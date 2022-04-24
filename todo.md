- [x] Refactor 2
    - [x] Use object factories to hide data
    - [x] completely separate dom (rename UI), data, storage
        - [x] all ui logic in on place
        - [x] TasksUI
            - [x] append further update to queue if queue is already running
        - [x] ControlsUI
            - Separate controls and task list View
        - [x] link accessors and callback handlers? (onX from index) - (semi-pubsub)
            - [x] finish moving dom manipulation outside for TasksUI manager...

- refactor 3
    - ?use Lists in data module
    - debounce listUI.update

## required tweaks

## ideas

- package into app and host
    - snowpack?

- responsive design
    - test on small screen

- PWA support

- wrap lines for very long tasks

- keyboard controls
- escape -> exits edit mode without altering task
- enter -> with no change, exits edit mode

- hotkeys
- keyboard navigation/selectable tasks

- migrate to indexDB for storing data?

- separate list for done tasks... only on a reload?