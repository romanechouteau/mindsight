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

export const MOOD_NAMES = {
    [MOODS.JOY]: 'extase',
    [MOODS.FEAR]: 'terreur',
    [MOODS.SADNESS]: 'chagrin',
    [MOODS.ANGER]: 'rage',
}

export const MOODS_SUMUP_ORDER = [
    MOODS.FEAR,
    MOODS.JOY,
    MOODS.SADNESS,
    MOODS.ANGER
]

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

export const LIST_MOODS = [MOODS.JOY, MOODS.FEAR, MOODS.SADNESS, MOODS.ANGER]

export const LIST_MOODS_PALETTE = [MOODS.JOY, MOODS.FEAR, MOODS.SADNESS, MOODS.ANGER]

export const WORLDBUILDER_MAX_VALUE = LIST_MOODS.length * WORLDBUILDER_PRECISION

export const SHAPE_NUMBER = 4

export enum SCENES {
    EYETRACKING = 1,
    ENVIRONMENT = 2,
    PARAMETERS = 3,
    BRUSH = 4,
    AUDIO = 5,
    WORD = 6,
    SUMUP = 7
}

export const LAST_SCENE = SCENES.SUMUP

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

export const SKY_COLORS = {
    [MOODS.JOY]: [0xFFD160, 0xFFF7DC],
    [MOODS.FEAR]: [0x0A1012, 0x343434],
    [MOODS.SADNESS]: [0x596E72, 0xC6C6C7],
    [MOODS.ANGER]: [0x621E19, 0xFFC4BF],
    [ENVIRONMENTS.BEACH]: [0xFFD160, 0xFFF7DC],
    [ENVIRONMENTS.MEADOW]: [0x0A1012, 0x343434],
}

export const GRASS_COLOR = {
    [ENVIRONMENTS.BEACH]: [0x736A3E, 0xDBCF8F, 0xA39758, 0xD4CEB0],
    [ENVIRONMENTS.MEADOW]: [0x595622, 0x878234, 0x595622, 0x878234]
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

export const BRUSH_PALETTE_ANGLES = [
    Math.PI * 2 / 3,
    Math.PI * 4 / 3,
    2 * Math.PI,
]

export const BRUSH_PALETTE_COLORS = {
    [MOODS.JOY]: 0xF8CF70,
    [MOODS.FEAR]: 0x263135,
    [MOODS.SADNESS]: 0x023A51,
    [MOODS.ANGER]: 0xDC4A3F,
}

export const BRUSH_LAST_POSITIONS = 5

// dynamic import is impossible with snowpack
// @ts-ignore
import bPlaine from '@textures/beach/PlaineSurface_Color.jpg'
// @ts-ignore
import bColline from '@textures/beach/CollinesSurface_Color.jpg'
// @ts-ignore
import bVallee from '@textures/beach/ValleeSurface_Color.jpg'
// @ts-ignore
import bMontagnes from '@textures/beach/MontagnesSurface_Color.jpg'

// @ts-ignore
import mPlaine from '@textures/meadow/PlaineSurface_Color.jpg'
// @ts-ignore
import mColline from '@textures/meadow/CollinesSurface_Color.jpg'
// @ts-ignore
import mVallee from '@textures/meadow/ValleeSurface_Color.jpg'
// @ts-ignore
import mMontagnes from '@textures/meadow/MontagnesSurface_Color.jpg'

export const ENVIRONMENTS_COLOR_MAPS = {
    [ENVIRONMENTS.BEACH]: [ bPlaine, bVallee, bColline, bMontagnes ],
    [ENVIRONMENTS.MEADOW]: [ mPlaine, mVallee, mColline, mMontagnes ],
}

// @ts-ignore
import dockRightModel from '@models/dock_right.gltf'
// @ts-ignore
import dockRightTexture from '@textures/beach/Dock_Right_Surface_Color.jpg'
// @ts-ignore
import dockLeftModel from '@models/dock_left.gltf'
// @ts-ignore
import dockLeftTexture from '@textures/beach/Dock_Left_Surface_Color.jpg'
// @ts-ignore
import pathRightModel from '@models/path_right.gltf'
// @ts-ignore
import pathRightTexture from '@textures/beach/Path_Right_Surface_Color.jpg'
// @ts-ignore
import pathLeftModel from '@models/path_left.gltf'
// @ts-ignore
import pathLeftTexture from '@textures/beach/Path_Left_Surface_Color.jpg'

export const BEACH_DOCKS = [
    {
        model: dockRightModel,
        texture: dockRightTexture,
        position: { x: -7637, z: 2906 },
        scale: 2,
        index: 1086
    },
    {
        model: dockLeftModel,
        texture: dockLeftTexture,
        position: { x: 723, z: -9975 },
        scale: 2,
        index: 1819
    },
    {
        model: pathRightModel,
        texture: pathRightTexture,
        position: { x: -9975, z: 16423 },
        scale: 1,
        index: 564
    },
    {
        model: pathLeftModel,
        texture: pathLeftTexture,
        position: { x: -2586, z: -17212 },
        scale: 1,
        index: 2368
    }
]

export const INTRO_TIMEOUTS = {
    fadeTitle: 2000,
    lineSplit: 2000,
    linesGoesAway: 5000,
    linesMoveAfterDisassemble: 1000
}

export const SUMUP_PARTICLES_COUNT = 1000