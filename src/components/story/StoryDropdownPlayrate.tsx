import { useState } from 'react'

import EBCSS from '@stylesheets/e-book.module.scss'

import { StoryMenuSpeedItemProps } from '@interfaces/IStory'

type StoryDropdownMenuPlayrateProps = {
  changePlaySpeed: (speed: number) => void
}

import icon_chev_down from '@assets/images/ebook/icon_chev_down.svg'

export default function StoryDropdownReadType({
  changePlaySpeed,
}: StoryDropdownMenuPlayrateProps) {
  // 기능: 메뉴 팝업 띄우기 및 버튼 선택시 이벤트
  const [isShow, setIsShow] = useState(false)
  const [speedList, setSpeedList] = useState<StoryMenuSpeedItemProps[]>([
    { rate: 0.8, selected: '' },
    { rate: 1, selected: 'on' },
    { rate: 1.2, selected: '' },
    { rate: 1.5, selected: '' },
  ])

  const selectedType = speedList.find((speed) => {
    return speed.selected === 'on'
  })

  const changePlayrate = (speedTypeIndex: number) => {
    const newList = [...speedList]

    newList.map((list) => {
      list.selected = ''
    })

    newList[speedTypeIndex].selected = 'on'

    changePlaySpeed(newList[speedTypeIndex].rate)
    setSpeedList(newList)
    setIsShow(false)
  }

  return (
    <div className={EBCSS.ebook_play_bar_drop_down_menu}>
      <div
        className={EBCSS.read_mode_option}
        onClick={() => {
          isShow ? setIsShow(false) : setIsShow(true)
        }}
      >
        <span>{selectedType?.rate}x</span>
        <img src={icon_chev_down} width={15} alt="" />
      </div>
      {isShow && (
        <>
          <div className={EBCSS.read_mode_option_menu}>
            <div className={EBCSS.menu_name}>Read Mode</div>
            {speedList.map((speed, i) => {
              return (
                <div
                  className={`${EBCSS.menu_item} ${
                    speed.selected ? EBCSS.on : ''
                  }`}
                  onClick={() => changePlayrate(i)}
                >
                  {speed.rate}x
                </div>
              )
            })}
          </div>
          <div
            className={EBCSS.light_box}
            onClick={() => {
              setIsShow(false)
            }}
          ></div>
        </>
      )}
    </div>
  )
}
