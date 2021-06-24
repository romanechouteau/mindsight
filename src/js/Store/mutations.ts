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
    updateWorldBuilderStep(state, payload) {
        state.worldBuilder.step = payload

        return state
    },
    chooseAudio(state, payload) {
        state.audioInputMode = payload

        return state
    },
    setSpotifyAudioData(state, payload) {
        state.spotifyAudioData = payload

        return state
    },
    updateEnvironment(state, payload) {
        state.environment = payload

        return state
    },
    chooseCursor (state, payload) {
        state.cursorMode = payload

        return state
    },
    finishIntro (state) {
        state.isIntro = false

        return state
    },
    registerEmotionWord (state, payload) {
        state.word = payload

        return state
    }
}