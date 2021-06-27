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
// @ts-ignore
import eyetracking_01 from '../../audio/eyetracking_01.mp3'
// @ts-ignore
import eyetracking_02 from '../../audio/eyetracking_02.mp3'
// @ts-ignore
import eyetracking_03 from '../../audio/eyetracking_03.mp3'
// @ts-ignore
import Musique_Ambiante from '../../audio/Musique_Ambiante.mp3'
// @ts-ignore
import vagues_plage from '../../audio/vagues_plage.mp3'
// @ts-ignore
import Vent_Herbes from '../../audio/Vent_Herbes.mp3'
import gsap from 'gsap/all'
import { SOUND_VOLUMES } from '../constants'

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
        eyetracking_01: HTMLAudioElement,
        eyetracking_02: HTMLAudioElement,
        eyetracking_03: HTMLAudioElement,
        Musique_Ambiante: HTMLAudioElement,
        vagues_plage: HTMLAudioElement,
        Vent_Herbes: HTMLAudioElement,
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
            eyetracking_01: new Audio(eyetracking_01),
            eyetracking_02: new Audio(eyetracking_02),
            eyetracking_03: new Audio(eyetracking_03),
            Musique_Ambiante: new Audio(Musique_Ambiante),
            vagues_plage: new Audio(vagues_plage),
            Vent_Herbes: new Audio(Vent_Herbes),
        }
        this.state = {
            currentIndex: 0,
            invitedToSkipAfterBrush: false,
            brushExplanationComplete: false,
            brushExplanationPromise: null,
        }
        this.sounds.Musique_Ambiante.loop = true
        this.sounds.vagues_plage.loop = true
        this.sounds.Vent_Herbes.loop = true
        this.sounds.Musique_Ambiante.volume = SOUND_VOLUMES.music
        this.sounds.vagues_plage.volume = SOUND_VOLUMES.beach
        this.sounds.Vent_Herbes.volume = SOUND_VOLUMES.meadow

        const voiceParams = {
            volume: SOUND_VOLUMES.voice
        }

        this.changeVoiceVolume(SOUND_VOLUMES.voice)

        setTimeout(() => {
            // @ts-ignore
            if (App.debug) {
                // @ts-ignore
                const folder = App.debug.addFolder('sound volumes')
                folder.add(this.sounds.Musique_Ambiante, 'volume').name('music volume')
                folder.add(this.sounds.vagues_plage, 'volume').name('vagues volume')
                folder.add(this.sounds.Vent_Herbes, 'volume').name('vent volume')
                folder.add(voiceParams, 'volume').name('voice volume').onChange(val => {
                    this.changeVoiceVolume(val)
                })
            }
        }, 50);
    }

    stopAllVoices() {
        const voices = Object.values(this.sounds)
        for (let i = 0; i < 12; i++) {
            voices[i].pause()
        }
    }

    playMusic() {
        this.sounds.Musique_Ambiante.play()
    }

    changeVoiceVolume(val) {
        const voices  = Object.values(this.sounds)
        for (let i = 0; i < 12; i++) {
            voices[i].volume =val
        }
    }

    playVoice(id: number, timeout?: number) {
        this.stopAllVoices()
        this.state.currentIndex = id
        return this.play('voice'+id, timeout)
    }

    play(id: string, timeout?: number) {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                this.sounds[id].play()
                this.sounds[id].addEventListener('ended', resolve)
            }, timeout ?? 1);
        })
    }

    fadeOut(id: string, duration = 2) {
        gsap.to(this.sounds[id], { 
            volume: 0, 
            ease: 'none', 
            duration,
            onComplete: () => this.pause(id)
        })
    }

    fadeIn(id: string, volume = 1, duration = 2) {
        this.sounds[id].volume = 0
        this.play(id)
        gsap.to(this.sounds[id], { 
            volume, 
            ease: 'none', 
            duration,
        })
    }

    pause(id: string) {
        this.sounds[id].pause()
    }
}

export default new SoundManager()