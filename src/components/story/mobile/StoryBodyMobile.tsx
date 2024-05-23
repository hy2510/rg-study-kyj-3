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

  const pageWidth = bookLevel === 'K' ? 480 : 525

  const containerScale = window.innerWidth / pageWidth

  return (
    <div
      className={style.ebook_body_mobile_p}
      onTouchStart={(e) => onTouchStartHandler(e)}
      onTouchEnd={(e) => onTouchEndHandler(e)}
    >
      <div style={{ transform: `scale(${containerScale})` }}>{children}</div>
    </div>
  )
}
