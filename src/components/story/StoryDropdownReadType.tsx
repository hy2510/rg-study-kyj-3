import { useContext, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import EBCSS from '@stylesheets/e-book.module.scss'

import { StoryMenuItemProps } from '@interfaces/IStory'

type StoryDropdownMenuReadTypeProps = {
  changeTextShow: (isShow: boolean) => void
  changeMuteAudio: (isMute: boolean) => void
  changeHighlight: (isHighlight: boolean) => void
}

import icon_chev_down from '@assets/images/ebook/icon_chev_down.svg'

export default function StoryDropdownReadType({
  changeTextShow,
  changeMuteAudio,
  changeHighlight,
}: StoryDropdownMenuReadTypeProps) {
  const { handler } = useContext(AppContext) as AppContextProps

  // 기능: 메뉴 팝업 띄우기 및 버튼 선택시 이벤트
  const [isShow, setIsShow] = useState(false)
  const [readTypeList, setReadTypeList] = useState<StoryMenuItemProps[]>([
    { name: 'Basic', selected: 'on' },
    { name: 'No Text', selected: '' },
    { name: 'No Audio', selected: '' },
    { name: 'No Highlight', selected: '' },
  ])

  const selectedType = readTypeList.find((readType) => {
    return readType.selected === 'on'
  })

  const openMenu = () => {
    if (handler.storyMode === 'Story') {
      isShow ? setIsShow(false) : setIsShow(true)
    } else {
      alert('Listen & Repeat 모드에서는 지원하지 않는 기능입니다.')
    }
  }

  const changeReadType = (readTypeIndex: number) => {
    const newList = [...readTypeList]

    newList.map((list) => {
      list.selected = ''
    })

    newList[readTypeIndex].selected = 'on'

    switch (readTypeIndex) {
      case 0:
        // basic
        changeTextShow(true)
        changeMuteAudio(false)
        changeHighlight(true)
        break

      case 1:
        // no text
        changeTextShow(false)
        changeMuteAudio(false)
        changeHighlight(true)
        break

      case 2:
        // no audio
        changeTextShow(true)
        changeMuteAudio(true)
        changeHighlight(false)
        break

      case 3:
        // no highlight
        changeTextShow(true)
        changeMuteAudio(false)
        changeHighlight(false)
        break
    }

    setReadTypeList(newList)
    setIsShow(false)
  }

  return (
    <div className={EBCSS.ebook_play_bar_drop_down_menu}>
      <div className={EBCSS.read_mode_option} onClick={() => openMenu()}>
        <span>{selectedType?.name}</span>
        <img src={icon_chev_down} width={15} alt="" />
      </div>
      {isShow && (
        <>
          <div className={EBCSS.read_mode_option_menu}>
            <div className={EBCSS.menu_name}>Read Mode</div>
            {readTypeList.map((menu, i) => {
              return (
                <div
                  className={`${EBCSS.menu_item} ${
                    menu.selected ? EBCSS.on : ''
                  }`}
                  onClick={() => changeReadType(i)}
                >
                  {menu.name}
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
