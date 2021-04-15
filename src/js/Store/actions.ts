export default {
    updateBrushParams(context, payload) {
        context.commit('updateBrushParams', payload)
    },
    updateScene(context, payload) {
        context.commit('updateScene', payload)
    },
    chooseAudio(context, payload) {
        context.commit('chooseAudio', payload)
    },
}