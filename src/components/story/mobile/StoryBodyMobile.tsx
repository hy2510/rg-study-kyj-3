import style from '@stylesheets/e-book.module.scss'
import { useContext } from 'react'
import { AppContext } from '@contexts/AppContext'

type StoryBodyMobileProps = {
  onTouchStartHandler: (e: React.TouchEvent<HTMLDivElement>) => void
  onTouchEndHandler: (e: React.TouchEvent<HTMLDivElement>) => void
  children: JSX.Element
}

export default function StoryBodyMobile({
  onTouchStartHandler,
  onTouchEndHandler,
  children,
}: StoryBodyMobileProps) {
  const bookLevel =
    useContext(AppContext)?.bookInfo?.BookLevel?.substring(0, 1) || 'K'

  const isLandscape = window.matchMedia('(orientation: landscape)').matches

  const pageWidth = bookLevel === 'K' ? 480 : 525
  const pageHeight = 750

  const containerScale = window.innerWidth / pageWidth
  const containerPortraitScale = (screen.height) / pageHeight

  return (
    <div
      className={style.ebook_body_mobile_p}
      onTouchStart={(e) => onTouchStartHandler(e)}
      onTouchEnd={(e) => onTouchEndHandler(e)}
    >
      <div className={style.container} style={{ transform: `scale(${isLandscape ? containerPortraitScale : containerScale})` }}>
        {children}
      </div>
    </div>
  )
}
