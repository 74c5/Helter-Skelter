- [x] throttle or debounce on saveTasks and drag?

- refactor
    - containerized object model?
    - completely separate dom (rename ui), data, storage
        - use Lists in data module
        - all ui logic in on place
            - append further update to queue if queue is already running
        - initialise and setCallbacks
        - sync accessors (onX from index) - semi-pubsub

## required tweaks

## ideas

- throttle/debounce on update UI?

- responsive design
    - test on small screen

- PWA support

- pending updates flag in data... this can be used to determine if updates to data?
    - or subscribe to changes via... callback pushed to data
- enter multi-line tasks?
- wrap lines for very long tasks

- keyboard controls
- escape -> exits edit mode without altering task
- enter -> with no change, exits edit mode

- hotkeys
- keyboard navigation/selectable tasks

- migrate to indexDB for storing data?

- separate list for done tasks... only on a reload?