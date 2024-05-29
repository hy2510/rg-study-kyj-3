import EBCSS from '@stylesheets/e-book.module.scss'
import { useContext, useEffect } from 'react'
import { AppContext } from '@contexts/AppContext'

type StoryBodyProps = {
  children: JSX.Element[]
}

export default function StoryBody({ children }: StoryBodyProps) {
  const bookLevel =
    useContext(AppContext)?.bookInfo?.BookLevel?.substring(0, 1) || 'K'
  const pageWidth = bookLevel === 'K' ? 480 : 525
  const isPortrait = window.matchMedia('(orientation: portrait)').matches
  const containerScale = (window.innerHeight - 100) / 750
  const containerPortraitScale = (window.innerWidth) / (pageWidth * 2)

  return (
    <div className={EBCSS.ebook_body_pc}>
      <div className={EBCSS.ebook_contents}>
        <div
          style={{ transform: `scale(${isPortrait ? containerPortraitScale : containerScale})` }}
          className={`${EBCSS.pages}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
