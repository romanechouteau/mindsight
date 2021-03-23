import Time from '../Tools/Time'

export interface State {
    time: Time
}

export const createState = (state?): State => ({
    time: new Time(),
    ...state
})