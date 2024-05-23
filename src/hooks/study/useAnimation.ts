const BASIC_ANIMATION = ['animate__animated']

type AnimProps = {
  target: HTMLElement
  anim: string
  end?: () => void
  secondAnim?: () => void
}

const useAnimation = () => {
  const animManager = {
    /**
     * 애니메이션 존재 유무 확인
     * @param target
     * @param anim
     * @returns boolean
     */
    isContain: (target: HTMLElement, anim: string): boolean => {
      return target.classList.contains(anim)
    },

    /**
     * 애니메이션 실행
     * @param target 타겟 Elment
     * @param anim css 애니메이션
     * @param end 다음 실행할 동작
     */
    play: (target: HTMLElement, anim: string[], end?: () => any) => {
      target.classList.add(...BASIC_ANIMATION, ...anim)

      if (end) {
        end()
      }
    },

    /**
     * 애니메이션 제거
     * @param target 타겟 Elment
     * @param anim css 애니메이션
     */
    remove: (target: HTMLElement, anim: string[]) => {
      target.classList.remove(...anim, ...BASIC_ANIMATION)
    },
    /**
     * 애니메이션을 제거 후 다음 애니메이션을 실행하는 함수
     * @param target 타겟 Element
     * @param prevAnim 이전 애니메이션
     * @param nextAnim 다음 애니메이션
     */
    removeAndPlay: <T extends HTMLElement>(
      target: T,
      prevAnim: string[],
      nextAnim: string[],
    ) => {
      target.classList.remove(...prevAnim)
      target.classList.add(...nextAnim)
    },
  }

  return animManager
}

export { useAnimation }
