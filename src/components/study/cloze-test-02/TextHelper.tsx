import { useEffect, useRef } from 'react'

type TextHelperProps = {
  correctText: string
  changeInputWidth: (width: number) => void
}

export default function TextHelper({
  correctText,
  changeInputWidth,
}: TextHelperProps) {
  const helperRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (helperRef.current) {
      changeInputWidth(helperRef.current.offsetWidth)
    }
  }, [])

  return (
    <span
      ref={helperRef}
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
