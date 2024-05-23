import { useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import { PageSequenceProps, PlayState } from '@interfaces/IStory'

import style from '@stylesheets/e-book.module.scss'

// 배속 관련 이미지
import icon_speed_08 from '@assets/images/ebook/icon_speed08.svg'
import icon_speed_10 from '@assets/images/ebook/icon_speed10.svg'
import icon_speed_12 from '@assets/images/ebook/icon_speed12.svg'
import icon_speed_15 from '@assets/images/ebook/icon_speed15.svg'

// 좌우 화살표 이미지
import icon_chev_white_left from '@assets/images/ebook/icon_chev_white_left.svg'
import icon_chev_white_right from '@assets/images/ebook/icon_chev_white_right.svg'

// 재생버튼 관련 이미지
import img_play from '@assets/images/ebook/btn_play.svg'
import img_pause from '@assets/images/ebook/btn_pause.svg'

// 단어장 이미지
import icon_word from '@assets/images/ebook/icon_word.svg'

// 우하단 3줄 메뉴
import icon_menu from '@assets/images/ebook/icon_menu.svg'

import StoryBottomLeftMenuMobile from './StoryBottomLeftMenuMobile'

type StoryBottomMenuMobileProps = {
  progressWidth: number
  isAutoNextPage: boolean
  pageSeq: PageSequenceProps
  playState: PlayState
  turnPageLeft: () => void
  turnPageRight: () => void
  changeTextShow: (isShow: boolean) => void
  changeMuteAudio: (isMute: boolean) => void
  changeHighlight: (isHighlight: boolean) => void
  changePlaySpeed: (speed: number) => void
  changeAutoNext: (isAuto: boolean) => void
  playAudio: (pageNumber: number, seq: number) => void
  pauseAudio: () => void
  resumeAudio: () => void
  changeVocaOpen: (state: boolean) => void
  changeSideMenu: (state: boolean) => void
}

export default function StoryBottomMenuMobile({
  progressWidth,
  isAutoNextPage,
  pageSeq,
  playState,
  turnPageLeft,
  turnPageRight,
  changeTextShow,
  changeMuteAudio,
  changeHighlight,
  changePlaySpeed,
  changeAutoNext,
  playAudio,
  pauseAudio,
  resumeAudio,
  changeVocaOpen,
  changeSideMenu,
}: StoryBottomMenuMobileProps) {
  const { handler } = useContext(AppContext) as AppContextProps

  const [isBottomLeftMenuOpen, setBottomLeftMenuOpen] = useState(false)

  const toggleBottomLeft = () => {
    setBottomLeftMenuOpen(!isBottomLeftMenuOpen)
  }

  return (
    <>
      {/* 프로그레스바 */}
      <div className={style.ebook_progress_bar}>
        <div
          className={style.progress}
          style={{ width: `${progressWidth}%` }}
        ></div>
      </div>

      {/* 플레이바 */}
      <div className={`${style.ebook_play_bar} ${style.mobile}`}>
        {/* 플레이바 > 왼쪽 */}
        <div className={style.ebook_play_bar_pc_area_l}>
          <div
            className={style.read_mode_button}
            onClick={() => {
              toggleBottomLeft()
            }}
          >
            <img src={icon_speed_10} width={30} height={30} />
          </div>

          <StoryBottomLeftMenuMobile
            isBottomLeftMenuOpen={isBottomLeftMenuOpen}
            isAutoNextPage={isAutoNextPage}
            changeTextShow={changeTextShow}
            changeMuteAudio={changeMuteAudio}
            changeHighlight={changeHighlight}
            changePlaySpeed={changePlaySpeed}
            changeAutoNext={changeAutoNext}
            toggleBottomLeft={toggleBottomLeft}
          />
        </div>

        {/* 플레이바 > 가운데 */}
        <div className={style.ebook_play_bar_pc_area_c}>
          {handler.storyMode === 'Story' && (
            <div
              className={style.backward}
              onClick={() => {
                turnPageLeft()
              }}
            >
              <img src={icon_chev_white_left} width={40} alt="" />
            </div>
          )}

          <div
            className={style.play}
            onClick={() => {
              switch (playState) {
                case 'play':
                case 'resume':
                  pauseAudio()
                  break
                case '':
                case 'stop':
                  playAudio(pageSeq.playPage, pageSeq.sequnce)
                  break
                case 'pause':
                  resumeAudio()
                  break
              }
            }}
          >
            {playState !== 'play' ? (
              <img src={img_play} width={40} />
            ) : (
              <img src={img_pause} width={40} />
            )}
          </div>

          {handler.storyMode === 'Story' && (
            <div
              className={style.forward}
              onClick={() => {
                turnPageRight()
              }}
            >
              <img src={icon_chev_white_right} width={40} alt="" />
            </div>
          )}
        </div>

        {/* 플레이바 > 오른쪽 */}
        <div className={style.ebook_play_bar_pc_area_r}>
          <div
            className={style.word_button}
            onTouchEnd={() => {
              changeVocaOpen(true)
            }}
          >
            <img src={icon_word} width={28} height={28} alt="" />
          </div>

          <div
            className={style.menu_button}
            onClick={() => {
              changeSideMenu(true)
            }}
          >
            <img src={icon_menu} width={24} height={24} alt="" />
          </div>
        </div>
      </div>
    </>
  )
}
