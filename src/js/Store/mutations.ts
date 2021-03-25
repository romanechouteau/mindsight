export default {
    updateBrushParams(state, payload) {
        const { param, value } = payload

        state.brush[param] = value

        return state
    },
}