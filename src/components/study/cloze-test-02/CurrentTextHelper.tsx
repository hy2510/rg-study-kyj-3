import { useEffect, useRef } from 'react'

type CurrentTextHelperProps = {
  correctText: string
  changeCurrentInputWidth: (width: number) => void
}

export default function CurrentTextHelper({
  correctText,
  changeCurrentInputWidth,
}: CurrentTextHelperProps) {
  const currenHelperRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (currenHelperRef.current) {
      changeCurrentInputWidth(currenHelperRef.current.offsetWidth)
    }
  }, [])

  return (
    <span
      ref={currenHelperRef}
      style={{
        display: 'block',
        color: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: '-1',
      }}
    >
      {correctText}
    </span>
  )
}
