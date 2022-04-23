/* Storage module 
 *  At the minute this only backs up to browser LocalStorage, 
 *  later this may use other services/methods
 */

import * as Utils from "./Utils.js";

export const create = () => {
    
    const save = (list, name='helter-skelter') => {
        localStorage.setItem(name, JSON.stringify(list));
    }

    const load = (name='helter-skelter') => {
        return JSON.parse(localStorage.getItem(name)) || [];
    }

    // public interface
    return {
        save : Utils.throttle(1000)(save),   // args: array of objects to save
        load                                 // returns: array of objects
    }
}