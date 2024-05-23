import { useState } from 'react'

const useResult = () => {
  const [isResultShow, setIsResultShow] = useState<boolean>(false)

  const changeResultShow = (state: boolean) => {
    setIsResultShow(state)
  }

  return { isResultShow, changeResultShow }
}

export { useResult }
