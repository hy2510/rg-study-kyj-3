import { useEffect, useRef } from 'react'

type CurrentTextHelperProps = {
  correctText: string
  changeCurrentInputWidth: (width: number) => void
}

export default function CurrentTextHelper({
  correctText,
  changeCurrentInputWidth,
}: CurrentTextHelperProps) {
  const currenHelperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currenHelperRef.current) {
      changeCurrentInputWidth(currenHelperRef.current.clientWidth)
    }
  }, [currenHelperRef])

  return (
    <div
      ref={currenHelperRef}
      style={{
        display: 'block',
        fontFamily: '"Rg-B", sans-serif',
        fontSize: '1em',
        color: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: '1',
      }}
    >
      {correctText}
    </div>
  )
}
