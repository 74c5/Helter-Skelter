- [x] re-ordering
    - [x] drag and drop
    - [x] help dialog

- throttle or debounce on saveTasks and updateUI?

- [x] refactor
    - [x] separate dom & logic
    - [x] module files (file is getting a bit long - all functions are available in root console)
    - completely separate dom (rename ui), data, storage
        - all ui logic in on place
        - initialise and setCallbacks
        - sync accessors (onX from index) - semi-pubsub
    - [x] separate storage module

- [x] batch input
    - [x] semicolon separated


## required tweaks

## ideas


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