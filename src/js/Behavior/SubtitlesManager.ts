import { queue } from "../Tools/asyncUtils"

class SubtitlesManager {
    fadeOutTimeout: number
    subtitles: {
        voice1: string[],
        voice2: string[],
        voice3: string[],
        voice4: string[],
        voice5: string[],
        voice6: string[],
        voice7: string[],
        voice8: string[],
        voice9: string[],
        voice10: string[],
        voice11: string[],
        voice12: string[],
        voice13: string[],
    }
    element: HTMLDivElement
    constructor() {
        this.subtitles = {
            voice1: [
                'Bienvenue.',
                'Je me présente à vous en tant que guide pour vous aider à façonner vos émotions inconscientes.',
                'Suivez bien attentivement ma voix, elle vous conseillera sur les actions à effectuer.'
            ],
            voice2: [
                'Lorsque vous vous sentez prêt, restez appuyé sur le clic gauche de votre souris pour démarrer l\'expérience.'
            ],
            voice3: [
                'Avant toute chose, vous devrez établir le pont vers votre inconscient. ',
                'Pour ce faire, fusionnez avec l’interface en fixant un des points lumineux, puis cliquez trois fois dessus.',
                'Répétez l’action, toujours en fixant bien correctement le point lumineux.'
            ],
            voice4: [
                'Félicitation, à partir de maintenant vous n’avez rien à penser, rien à faire. ',
                'Détendez-vous, et stabilisez votre regard.',
            ],
            voice5: [
                'Les portes vers votre inconscient s’ouvrent peu à peu. ',
                'Vous êtes désormais le seul à pouvoir voir ce que vous voyez. ',
                'Glissez vers le bas pour survolez l’environnement et prenez bien le temps de vous y projeter.',
                'Choisissez le lieu où vous vous sentez naturellement le plus libre et le plus à l’aise. ',
                'Une fois décidé, rester appuyer sur le clic gauche de votre souris.',
            ],
            voice6: [
                'Bien. Considérez ce paysage comme une frontière entre l’abstraction et la réalité. ',
                'Déplacez-vous avec votre curseur afin d’y ressentir pleinement l’espace environnant. ',
                'Mais attention, ici, le jugement n’existe plus. ',
                'Oubliez toutes valeurs scientifiques et artistiques. ',
                'Vous êtes à l’origine même de ce paysage, c’est donc à vous le façonner avec vos émotions.',
            ],
            voice7: [
                'Observez le bas de l’écran, une ligne lumineuse devrait apparaître. ',
                'Grâce à elle, vous pouvez moduler le paysage en la survolant avec votre curseur. ',
                'Lorsqu\'une représentation du paysage vous fait ressentir quelque chose, maintenez le clic gauche. ',
                'Ne vous inquiétez pas, bientôt nous arriverons à mettre un mot sur ce quelque chose.',
            ],
            voice8: [
                'N’oubliez pas, vous avez toujours la possibilité de vous déplacer avec le raccourci numérique deux, en haut à droite.',
            ],
            voice9: [
                'Vous venez de concevoir une base au développement de vos émotions. ',
                'C’est désormais le moment de les exprimer pleinement. ',
                'Avec votre curseur, tel un pinceau de particule, cliquez sur le raccourci numérique 3 et appuyez sur le clic gauche de votre souris. ',
                'De manière spontanée, laissez votre main se déplacer.',
                'Les tracés de particules doivent venir du plus profond de vous.',
            ],
            voice10: [
                'Cliquez une seconde fois sur le raccourci numérique trois pour modifier votre manière de peindre.',
            ],
            voice11: [
                'Lorsque vos tracés reflètent vos émotions, reprenez le curseur de base via le raccourci numérique un, et restez appuyer sur le clic gauche.',
            ],
            voice12: [
                'Il est temps pour moi de vous laisser. Ce chemin psychologique doit se finir seul. ',
                'Vous avez réussi jusqu’ici à représenter des notions abstraites de votre inconscient,',
                'il est désormais temps d\'interagir directement avec elles pour mieux les comprendre.',
            ],
            voice13: [
                'Deux possibilités s’offrent à vous. ',
                'Vous pouvez choisir une musique via le raccourci numérique 9, ou bien interagir directement avec votre micro par le raccourci numérique 0. ',
                'Une fois que vous aurez saisi toute la complexité de vos émotions appuyer sur le clic gauche.',
                'Je suis ravi d’avoir partagé avec vous cet instant.',
            ],
        }

        this.element = document.querySelector('#subtitles .inner')
    }

    async readVoiceGroup(groupId: string) {
        window.clearTimeout(this.fadeOutTimeout)
        // this.element.classList.add('visible')
        let previousTextLength = 0
        for (const [index, line] of Object.entries(this.subtitles[groupId])) {
            const words = (line as string).split(' ').length
            const commas = (line as string).split(',').length - 1
            const points = (line as string).split('.').length - 1
            const bienvenue = (line as string).split('Bienvenue').length - 1
            const timeout = 300 * words + 300 * commas + points * 300 + bienvenue * 600
            setTimeout(() => this.readLine(line as string, timeout), previousTextLength)
            previousTextLength += timeout
        }
        // setTimeout(() => {
        //     this.element.classList.remove('visible')
        // }, previousTextLength);
    }

    readLine(lineContent: string, timeout: number) {
        this.element.textContent = lineContent
        this.element.classList.add('visible')
        this.fadeOutTimeout = window.setTimeout(() => {
            this.element.classList.remove('visible')
        }, timeout - 300)
    }
}

export default new SubtitlesManager()