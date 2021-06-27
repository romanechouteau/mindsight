import gsap from "gsap/all"

export const eyeMovement = (moveX, moveY, element, duration, currentVH, elemBoxes, elemMovement, pupilShine, data) => {
    const { outerEyeBox, innerEyeBox, pupilBox, pupilCenterBox } = elemBoxes
    const { outerEyeMovement, innerEyeMovement, pupilMovement, pupilShineMovement } = elemMovement

        gsap.to(element.querySelector('.outerEye'), {
            duration,
            translateX: `${moveX * outerEyeMovement}%`,
            translateY: `${currentVH + moveY * outerEyeMovement * outerEyeBox.height * 0.01}px`,
        })

        gsap.to(element.querySelector('.innerEye'), {
            duration,
            translateX: `${moveX * innerEyeMovement}%`,
            translateY: `${currentVH + moveY * innerEyeMovement * innerEyeBox.height * 0.01}px`,
        })

        gsap.to(element.querySelectorAll('.pupil, .maskWrapper .pupilWhite'), {
            duration,
            translateX: `${moveX * pupilMovement * pupilBox.width * 0.01}px`,
            translateY: `${currentVH + moveY * pupilMovement * pupilBox.height * 0.01}px`,
        })

        if (data) {
            gsap.to(element.querySelectorAll('.dataWrapper'), {
                duration,
                translateX: `${moveX * pupilMovement * pupilBox.width * 0.01}px`,
                translateY: `${currentVH + moveY * pupilMovement * pupilBox.height * 0.01}px`,
            })
            gsap.to(element.querySelectorAll('.data'), {
                duration,
                translateX: `${- (moveX * pupilMovement * pupilBox.width * 0.01)}px`,
                translateY: `${- (currentVH + moveY * pupilMovement * pupilBox.height * 0.01)}px`,
            })
        }

        if (pupilShine) {
            gsap.to(element.querySelectorAll('#maskPupil .maskWrapper'), {
                duration,
                translateX: `${-(moveX * pupilMovement * pupilBox.width * 0.01)}px`,
                translateY: `${-(currentVH + moveY * pupilMovement * pupilBox.height * 0.01)}px`,
            })

            gsap.to(element.querySelectorAll('#maskShine .maskWrapper'), {
                duration,
                translateX: `${-(moveX * pupilShineMovement * pupilCenterBox.width * 0.01)}px`,
                translateY: `${-(currentVH + moveY * pupilShineMovement * pupilCenterBox.height * 0.01)}px`,
            })

            gsap.to(element.querySelector('.pupilCenterMask'), {
                duration,
                translateX: `${moveX * pupilShineMovement * pupilCenterBox.width * 0.01}px`,
                translateY: `${currentVH + moveY * pupilShineMovement * pupilCenterBox.height * 0.01}px`
            })

            gsap.to(element.querySelector('.pupilCenter'), {
                duration,
                translateX: `${moveX * pupilShineMovement * pupilCenterBox.width * 0.01}px`,
                translateY: `${currentVH + moveY * pupilShineMovement * pupilCenterBox.height * 0.01}px`
            })
        }
}