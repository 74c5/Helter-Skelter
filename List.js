export const node = (data) => {
    return {
        ...data,
        prev : undefined,
        next : undefined
    }
}

/**
 * @param data = array of nodes
 * @returns 
 *  a sort of linked list with
 *  - each node populated with ...data[i] which includes and id field
 *  - utility functions added to the base
 */
export const create = (data = []) => {
    // private state
    let first;
    let last;
    const lookup = new Map();

    // methods
    const search = (cb) => {
        let found = first;
        while (found && !cb(found)) found = found.next;
        return found;
    }
    
    const insert = (node, before = undefined) => {
        node.prev = (before)? before.prev : last;
        node.next = before;
        
        if (before) {
            if (before.prev) before.prev.next = node;
            else first = node;
            before.prev = node;
        } else {
            if (last) last.next = node;
            last = node;
        }
        if (!first) first = node;
        lookup.set(node.id, node);
    }
    
    const remove = (node) => {
        if (node.prev) node.prev.next = node.next;
        else first = node.next;
        
        if (node.next) node.next.prev = node.prev;
        else last = node.prev;
        lookup.delete(node.id);
    }

    const toString = () => {
        let text = '';
        let node = first;
        while (node) {
            let line = '';
            for (let key in node) { 
                let value;
                switch (key) {
                    case 'prev':
                    case 'next':
                        value = `${key}: ${(node[key])? node[key].id : undefined}`
                        break;
                    default:
                        value = `${key}: ${node[key]}`
                }
                line = `${line}${(line.length>0)? ', ' : ''}${value}`
            }
            text = `${text}${(text.length>0)? '\n' : ''}${line}`;
            node = node.next;
        }
        text = `first: ${first?.id}, last: ${last?.id}\n${text}`;
        return text;
    }

    // add initial data
    for(let i=0; i<data.length; i++) insert(data[i]);

    /* public interface */
    return {
        append   : (node) => {insert(node)},
        find     : (id) => {return lookup.get(id)},
        search,
        first    : () => first,
        insert,
        last     : () => last,
        remove,
        toString
    };
}

