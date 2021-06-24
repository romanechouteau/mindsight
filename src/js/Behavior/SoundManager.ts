// @ts-ignore
import voice1 from '../../audio/VoixOff_01.mp3'
// @ts-ignore
import voice2 from '../../audio/VoixOff_02.mp3'
// @ts-ignore
import voice3 from '../../audio/VoixOff_03.mp3'
// @ts-ignore
import voice4 from '../../audio/VoixOff_04.mp3'
// @ts-ignore
import voice5 from '../../audio/VoixOff_05.mp3'
// @ts-ignore
import voice6 from '../../audio/VoixOff_06.mp3'
// @ts-ignore
import voice7 from '../../audio/VoixOff_07.mp3'
// @ts-ignore
import voice8 from '../../audio/VoixOff_08.mp3'
// @ts-ignore
import voice9 from '../../audio/VoixOff_09.mp3'
// @ts-ignore
import voice10 from '../../audio/VoixOff_10.mp3'
// @ts-ignore
import voice11 from '../../audio/VoixOff_11.mp3'
// @ts-ignore
// @ts-ignore
import voice12 from '../../audio/VoixOff_12.mp3'
// @ts-ignore
import voice13 from '../../audio/VoixOff_13.mp3'

class SoundManager {
    state: {
        currentIndex: number,
        invitedToSkipAfterBrush: boolean,
        brushExplanationComplete: boolean,
        brushExplanationPromise: Promise<void>,
    }
    sounds: {
        voice1: HTMLAudioElement,
        voice2: HTMLAudioElement,
        voice3: HTMLAudioElement,
        voice4: HTMLAudioElement,
        voice5: HTMLAudioElement,
        voice6: HTMLAudioElement,
        voice7: HTMLAudioElement,
        voice8: HTMLAudioElement,
        voice9: HTMLAudioElement,
        voice10: HTMLAudioElement,
        voice11: HTMLAudioElement,
        voice12: HTMLAudioElement,
        voice13: HTMLAudioElement,
    }
    constructor() {
        this.sounds = {
            voice1: new Audio(voice1),
            voice2: new Audio(voice2),
            voice3: new Audio(voice3),
            voice4: new Audio(voice4),
            voice5: new Audio(voice5),
            voice6: new Audio(voice6),
            voice7: new Audio(voice7),
            voice8: new Audio(voice8),
            voice9: new Audio(voice9),
            voice10: new Audio(voice10),
            voice11: new Audio(voice11),
            voice12: new Audio(voice12),
            voice13: new Audio(voice13),
        }
        this.state = {
            currentIndex: 0,
            invitedToSkipAfterBrush: false,
            brushExplanationComplete: false,
            brushExplanationPromise: null,
        }
    }

    play(id: number, timeout?: number) {
        this.state.currentIndex = id
        return new Promise<void>(resolve => {
            setTimeout(() => {
                this.sounds['voice'+id].play()
                this.sounds['voice'+id].addEventListener('ended', resolve)
            }, timeout ?? 1);
        })
    }

    pause(id: number) {
        this.sounds['voice'+id].pause()
    }
}

export default new SoundManager()