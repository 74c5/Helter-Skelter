/** 
 * Storage module 
 *  At the minute this only backs up to browser LocalStorage, 
 *  later this may use other services/methods
 */

export const initialise = () => {
    
    const save = (list, name='helter-skelter') => {
        localStorage.setItem(name, JSON.stringify(list));
    }

    const load = (name='helter-skelter') => {
        return JSON.parse(localStorage.getItem(name)) || [];
    }

    // public interface
    return {
        save,   // args: array of objects to save
        load    // returns: array of objects
    }
}