export default {
    skipIntro(context) {
        context.commit('skipIntro')
    },
    updateBrushParams(context, payload) {
        context.commit('updateBrushParams', payload)
    },
    updateScene(context, payload) {
        context.commit('updateScene', payload)
    },
    updateWorldBuilderStep(context, payload) {
        context.commit('updateWorldBuilderStep', payload)
    },
    chooseAudio(context, payload) {
        context.commit('chooseAudio', payload)
    },
    setSpotifyAudioData(context, payload) {
        context.commit('setSpotifyAudioData', payload)
        context.events.publish('setSpotifyAudioData')
    },
    updateEnvironment(context, payload) {
        context.commit('updateEnvironment', payload)
        context.events.publish('updateEnvironment')
    },
    chooseCursor(context, payload) {
        context.commit('chooseCursor', payload)
    },
}