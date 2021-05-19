/**
 * setTimeout, but returning a promise, and therefore can be awaited to queue functions
 */
export function queue (cb: Function, time: number) {
    new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            try {
                cb()
                resolve()
            } catch (error) {
                reject()
            }
        }, time)
    })
}