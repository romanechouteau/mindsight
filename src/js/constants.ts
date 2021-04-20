import { Vector3 } from "three"

export const LAST_SCENE = 5

export const MAX_DISTANCE = 20

export const ZONES_LIMITS = [MAX_DISTANCE, MAX_DISTANCE/2, MAX_DISTANCE/4]

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

export const SHAPE_NUMBER = 4