/**
 * Credit to WebDev Simplified
 * https://blog.webdevsimplified.com/2022-03/debounce-vs-throttle/
 */

export const debounce = (delay = 250) => {
    return (cb) => {
      let timeout
  
        return (...args) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                cb(...args)
            }, delay)
        }
    }
}


export const throttle = (delay = 250) => {
    return (cb) => {
        let isWaiting = false
        let waitingArgs

        const timeoutFunc = () => {
            if (waitingArgs == null) {
                isWaiting = false
            } else {
                cb(...waitingArgs)
                waitingArgs = null
                setTimeout(timeoutFunc, delay)
            }
        }
    
        return (...args) => {
            if (isWaiting) {
                waitingArgs = args
                return
            }
        
            cb(...args)
            isWaiting = true
        
            setTimeout(timeoutFunc, delay)
        }
    }
}