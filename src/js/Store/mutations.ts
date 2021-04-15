export default {
    updateBrushParams(state, payload) {
        const { param, value } = payload

        state.brush[param] = value

        return state
    },
    updateScene(state, payload) {
        state.scene = payload

        return state
    },
    chooseAudio(state, payload) {
        state.audioInputMode = payload

        return state
    },
    setSpotifyAudioData(state, payload) {
        state.spotifyAudioData = payload

        return state
    }
}