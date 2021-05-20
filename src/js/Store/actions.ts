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
    setSpotifyAudioData(context, payload) {
        context.commit('setSpotifyAudioData', payload)
        context.events.publish('setSpotifyAudioData')
    },
    updateEnvironment(context, payload) {
        context.commit('updateEnvironment', payload)
        context.events.publish('updateEnvironment')
    }
}