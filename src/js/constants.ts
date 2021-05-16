import { Vector3 } from "three"

export const LAST_SCENE = 5

export const MAX_DISTANCE = 20

export const ZONES_LIMITS = [MAX_DISTANCE, MAX_DISTANCE/2, MAX_DISTANCE/4]

export const ENV_DISTANCE = 40

export enum MOODS {
    JOY = "joy",
    FEAR = "fear",
    SADNESS = "sadness",
    ANGER = "anger",
}

// TODO: faire le découpage de manière dynamique en fonction du nombre d'émotion
export const moodPositions = {
    [MOODS.JOY]: new Vector3(0, 0, MAX_DISTANCE),
    [MOODS.FEAR]: new Vector3(MAX_DISTANCE, 0, 0),
    [MOODS.SADNESS]: new Vector3(0, 0, -MAX_DISTANCE),
    [MOODS.ANGER]: new Vector3(-MAX_DISTANCE, 0, 0),
}

export enum AUDIO_INPUT_MODES {
    SPOTIFY = 'spotify',
    VOICE = 'voice',
    NONE = 'none'
}

export enum WORLDBUILDER_STEPS {
    GROUND = 'ground',
    SHAPE = 'shape',
    SKY = 'sky',
}

export const WORLDBUILDER_PRECISION = 3

export const SKY_COLORS = {
    [MOODS.JOY]: [0xFFD160, 0xFFF7DC],
    [MOODS.FEAR]: [0x0A1012, 0x343434],
    [MOODS.SADNESS]: [0x596E72, 0xC6C6C7],
    [MOODS.ANGER]: [0x621E19, 0xFFC4BF],
}

export const LIST_MOODS = Object.values(MOODS)

export const WORLDBUILDER_MAX_VALUE = LIST_MOODS.length * WORLDBUILDER_PRECISION

export const SHAPE_NUMBER = 4

export enum SCENES {
    EYETRACKING = 1,
    ENIVRONMENT = 2,
    PARAMETERS = 3,
    BRUSH = 4,
    AUDIO = 5,
    SUMUP = 6
}

export const CURSOR_SIZE = new Vector3(2, 2, 1)