import { Vector3 } from "three"

export const MAX_DISTANCE = 20

export const ZONES_LIMITS = [MAX_DISTANCE, MAX_DISTANCE/2, MAX_DISTANCE/4]

export const ENV_DISTANCE = 45

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

export enum CURSOR_MODES {
    DEFAULT = 'default',
    MOVE = 'move',
    BRUSH = 'brush'
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
    ENVIRONMENT = 2,
    PARAMETERS = 3,
    BRUSH = 4,
    AUDIO = 5,
    SUMUP = 6
}

export const LAST_SCENE = SCENES.AUDIO

export const EYETRACKING_RADIUS = 0.5

export const EYETRACKING_DURATION = 60

export const EYETRACKING_SUCCESS = 0.8

export const OUTER_EYE_MOVEMENT = 0.3

export const INNER_EYE_MOVEMENT = 3

export const PUPIL_MOVEMENT = 25

export const PUPIL_SHINE_MOVEMENT = 30

export const EYE_TRACKING_DEBOUNCE = 20

export const CURSOR_SIZE = new Vector3(2, 2, 1)

export const BLOOM_LAYER = 1

export enum ENVIRONMENTS {
    BEACH = "beach",
    MEADOW = "meadow"
}

export const LIST_ENVIRONMENTS = Object.values(ENVIRONMENTS)

export const GRASS_COLOR = {
    [ENVIRONMENTS.BEACH]: [0x736A3E, 0xDBCF8F, 0xA39758, 0xD4CEB0],
    [ENVIRONMENTS.MEADOW]: [0x2A3B3A, 0x728762, 0x425d5c, 0x869b75]
}

export const ENVIRONMENT_INDICES = {
    [ENVIRONMENTS.BEACH]: 0,
    [ENVIRONMENTS.MEADOW]: 1,
}
export const HOLD_DURATION = 60

export const HOLD_DELAY = 10

export const GROUND_SCALE = 0.1

export const ENVIRONMENTS_BORDERS_MARGIN = 7

export const START_FOG_FAR = 30

export const DEFAULT_FOG_FAR = 50

// dynamic import is impossible with snowpack
// TODO: try with require.context plugin
// @ts-ignore
import bPlaine from '@textures/beach/Plaine_Surface_Color.jpg'
// @ts-ignore
import bColline from '@textures/beach/Colline_Surface_Color.jpg'
// @ts-ignore
import bVallee from '@textures/beach/Vallee_Surface_Color.jpg'
// @ts-ignore
import bMontagnes from '@textures/beach/Montagnes_Surface_Color.jpg'

// @ts-ignore
import mPlaine from '@textures/meadow/PlaineSurface_Color.jpg'
// @ts-ignore
import mColline from '@textures/meadow/CollinesSurface_Color.jpg'
// @ts-ignore
import mVallee from '@textures/meadow/ValleeSurface_Color.jpg'
// @ts-ignore
import mMontagnes from '@textures/meadow/MontagnesSurface_Color.jpg'

export const ENVIRONMENTS_COLOR_MAPS = {
    [ENVIRONMENTS.BEACH]: [ bPlaine, bColline, bVallee, bMontagnes ],
    [ENVIRONMENTS.MEADOW]: [ mPlaine, mColline, mVallee, mMontagnes ],
}