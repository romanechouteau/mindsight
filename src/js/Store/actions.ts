export default {
    updateBrushParams(context, payload) {
        context.commit('updateBrushParams', payload)
    },
    updateScene(context, payload) {
        context.commit('updateScene', payload)
    },
    setSpotifyAudioData(context, payload) {
        context.commit('setSpotifyAudioData', payload)
        context.events.publish('setSpotifyAudioData')
    }
}