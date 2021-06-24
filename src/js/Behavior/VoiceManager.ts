class VoiceManager {
    started: Boolean
    audioData: Uint8Array
    bufferSize: number
    audioContext: AudioContext
    audioAnalyser: any

    constructor() {
        this.audioData = new Uint8Array()
        this.started = false
    }

    start() {
        try {
            this.started = true
            navigator.getUserMedia ({ audio: true }, this.getStream.bind(this), (err) => console.log(err))
        } catch (err) {
            console.error('Web Audio API is not supported in this browser')
        }
    }

    stop() {
        this.started = false
        if (this.audioContext) {
            this.audioContext.close()
        }
    }

    // get audio stream
    getStream(stream) {
        // @ts-ignore
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

        const source = this.audioContext.createMediaStreamSource(stream)
        this.audioAnalyser = this.audioContext.createAnalyser()
        this.audioAnalyser.fftSize = 2048
        source.connect(this.audioAnalyser)

        this.bufferSize = this.audioAnalyser.frequencyBinCount
        this.audioData = new Uint8Array(this.bufferSize)
    }

    getAudioData() {
        if (this.audioAnalyser !== undefined) {
            this.audioAnalyser.getByteTimeDomainData(this.audioData)
        }
        return this.audioData
    }
}

const instance = new VoiceManager()
export default instance