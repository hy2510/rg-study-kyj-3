import { useState } from 'react'

const useStepIntro = () => {
  const [isStepIntro, setShow] = useState<boolean>(true)

  const closeStepIntro = (fn?: any) => {
    setShow(false)

    if (fn) {
      fn()
    }
  }

  return { isStepIntro, closeStepIntro }
}

export default useStepIntro
