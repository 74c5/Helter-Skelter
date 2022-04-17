/**
 * Credit to WebDev Simplified
 * https://blog.webdevsimplified.com/2022-03/debounce-vs-throttle/
 */

export const debounce = (cb, delay = 250) => {
    let timeout
  
    return (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        cb(...args)
      }, delay)
    }
}

export const throttle = (cb, delay = 250) => {
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