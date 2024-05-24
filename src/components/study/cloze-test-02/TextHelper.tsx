import { useEffect, useRef } from 'react'

type TextHelperProps = {
  correctText: string
  changeInputWidth: (width: number) => void
}

export default function TextHelper({
  correctText,
  changeInputWidth,
}: TextHelperProps) {
  const helperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (helperRef.current) {
      changeInputWidth(helperRef.current.clientWidth)
    } 
    
  },[helperRef])

  return (
    <div
      ref={helperRef}
      style={{
        display: 'block',
        fontFamily: '"Rg-B", sans-serif',
        fontSize: '1em',
        color: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: '-1',
      }}
    >
      {correctText}
    </div>
  )
}
