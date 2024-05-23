import { useState } from 'react'

import style from '@stylesheets/e-book.module.scss'

import { StoryMenuItemProps, StoryMenuSpeedItemProps } from '@interfaces/IStory'

import StoryBottomMenuReadTypeMobile from './StoryBottomMenuReadTypeMobile'
import PageTurningType from './PageTurningType'
import StoryBottomMenuSpeed from './StoryBottomMenuSpeed'

type StoryBottomLeftMenuMobileProps = {
  isBottomLeftMenuOpen: boolean
  isAutoNextPage: boolean
  changeTextShow: (isShow: boolean) => void
  changeMuteAudio: (isMute: boolean) => void
  changeHighlight: (isHighlight: boolean) => void
  changePlaySpeed: (speed: number) => void
  changeAutoNext: (isAuto: boolean) => void
  toggleBottomLeft: () => void
}

export default function StoryBottomLeftMenuMobile({
  isBottomLeftMenuOpen,
  isAutoNextPage,
  changeTextShow,
  changeMuteAudio,
  changeHighlight,
  changePlaySpeed,
  changeAutoNext,
  toggleBottomLeft,
}: StoryBottomLeftMenuMobileProps) {
  const [bottomLeftAnim, setBottomLeftAnim] = useState<
    'slide-in-bottom' | 'slide-out-bottom'
  >('slide-in-bottom')

  const [readTypeList, setReadTypeList] = useState<StoryMenuItemProps[]>([
    { name: 'Basic', selected: 'on' },
    { name: 'No Text', selected: '' },
    { name: 'No Audio', selected: '' },
    { name: 'No Highlight', selected: '' },
  ])

  const [speedList, setSpeedList] = useState<StoryMenuSpeedItemProps[]>([
    { rate: 0.8, selected: '' },
    { rate: 1, selected: 'on' },
    { rate: 1.2, selected: '' },
    { rate: 1.5, selected: '' },
  ])

  const closeBottomeLeft = () => {
    setBottomLeftAnim('slide-out-bottom')

    setTimeout(() => {
      setBottomLeftAnim('slide-in-bottom')
      toggleBottomLeft()
    }, 500)
  }

  const changeReadTypeList = (newReadTypeList: StoryMenuItemProps[]) => {
    setReadTypeList(newReadTypeList)
  }

  const changePlaySpeedList = (newSpeedList: StoryMenuSpeedItemProps[]) => {
    setSpeedList(newSpeedList)
  }

  return (
    <>
      {isBottomLeftMenuOpen && (
        <div
          className={`${style.ebook_play_mode_mobile}
      ${
        bottomLeftAnim === 'slide-in-bottom'
          ? style.slide_in_bottom
          : style.slide_out_bottom
      }`}
        >
          <div className={style.container}>
            {/* 읽기 모드 */}
            <StoryBottomMenuReadTypeMobile
              readTypeList={readTypeList}
              changeReadTypeList={changeReadTypeList}
              changeTextShow={changeTextShow}
              changeHighlight={changeHighlight}
              changeMuteAudio={changeMuteAudio}
            />

            {/* 읽기 속도 */}
            <StoryBottomMenuSpeed
              speedList={speedList}
              changePlaySpeedList={changePlaySpeedList}
              changePlaySpeed={changePlaySpeed}
            />

            {/* 책장 넘기기 */}
            <PageTurningType
              isAutoNextPage={isAutoNextPage}
              changeAutoNext={changeAutoNext}
            />
          </div>

          <div
            className={style.light_box}
            onClick={() => {
              closeBottomeLeft()
            }}
          ></div>
        </div>
      )}
    </>
  )
}
