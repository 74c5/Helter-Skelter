export const create = () => {
    /* private local state */

    /* dom handles */
    const helpBtn   = document.querySelector('#btn-help');
    const input     = document.querySelector('#input-new-task');
    const helpModal = document.querySelector('#modal-help');
    const randomBtn = document.querySelector('#btn-randomize');

    /* functions */
    const initialise = ({newInputCB, randomiseCB}) => {
        // set up event listeners
        const onInputChange = (event) => {
            event.stopPropagation();
            event.preventDefault();
            const value = event.currentTarget.value;

            if (!value || value == '') return;
            
            newInputCB(value);
            event.currentTarget.value = '';
        }

        helpBtn.addEventListener('click', showHelp);
        input.addEventListener('change', onInputChange);
        helpModal.addEventListener('click', hideHelp);
        randomBtn.addEventListener('click', (event) => { randomiseCB(); });
    }

    const setFocus = () => { input.focus(); };
    
    const showHelp = () => {
        helpModal.classList.remove('off-screen-left');     // remove the class
    }
    
    const hideHelp = () => {
        helpModal.classList.add('off-screen-left');        // re-add the class
    }
    

    /* public interface */
    return {
        hideHelp,
        initialise,
        setFocus,
        showHelp
    }
}
