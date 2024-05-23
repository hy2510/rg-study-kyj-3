import EBCSS from '@stylesheets/e-book.module.scss'

import icon_chev_white_left from '@assets/images/ebook/icon_chev_white_left.svg'
import icon_chev_white_right from '@assets/images/ebook/icon_chev_white_right.svg'

type StoryPageControllerProps = {
  turnPageLeft: () => void
  turnPageRight: () => void
}

export default function StoryPageController({
  turnPageLeft,
  turnPageRight,
}: StoryPageControllerProps) {
  return (
    <div className={EBCSS.ebook_page_arrows}>
      <div className={EBCSS.left_arrow}>
        <button
          onClick={() => {
            turnPageLeft()
          }}
        >
          <img src={icon_chev_white_left} width={60} alt="" />
        </button>
      </div>
      <div className={EBCSS.right_arrow}>
        <button
          onClick={() => {
            turnPageRight()
          }}
        >
          <img src={icon_chev_white_right} width={60} alt="" />
        </button>
      </div>
    </div>
  )
}
