import { AUDIO_INPUT_MODES, WORLDBUILDER_STEPS } from "../constants";

export default {
    brush: {
        size: 0.3,
        count: 10,
        particleSize: 20,
        color: [50, 50],
        canDraw: false,
    },
    emotion: 'joy',
    scene: 2,
    audioInputMode: AUDIO_INPUT_MODES.NONE,
    spotifyAudioData: {
        sectionIndex: null
    },
    worldBuilder: {
        step: WORLDBUILDER_STEPS.GROUND
    },
    environment: 0
  };