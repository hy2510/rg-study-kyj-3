import { useContext, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import EBCSS from '@stylesheets/e-book.module.scss'

type StoryDropDownMenuProps = {
  menuName: string
  menuItems: { name: string; selected: '' | 'on' }[]
  changeAutoNextPage: (isAuto: boolean) => void
}

import icon_chev_down from '@assets/images/ebook/icon_chev_down.svg'

export default function StoryDropdownMenu({
  menuName,
  menuItems,
  changeAutoNextPage,
}: StoryDropDownMenuProps) {
  const { handler } = useContext(AppContext) as AppContextProps

  // 기능: 메뉴 팝업 띄우기 및 버튼 선택시 이벤트
  const [isShow, setIsShow] = useState(false)
  const [menuList, setMenuList] =
    useState<StoryDropDownMenuProps['menuItems']>(menuItems)

  const selectedMode = menuList.filter((menu) => {
    return menu.selected === 'on'
  })

  const openMenu = () => {
    if (handler.storyMode === 'Story') {
      isShow ? setIsShow(false) : setIsShow(true)
    } else {
      alert('Listen & Repeat 모드에서는 지원하지 않는 기능입니다.')
    }
  }
  return (
    <div className={EBCSS.ebook_play_bar_drop_down_menu}>
      <div className={EBCSS.read_mode_option} onClick={() => openMenu()}>
        <span>{selectedMode[0].name}</span>
        <img src={icon_chev_down} width={15} alt="" />
      </div>
      {isShow && (
        <>
          <div className={EBCSS.read_mode_option_menu}>
            <div className={EBCSS.menu_name}>{menuName}</div>
            {menuList.map((menu, i) => {
              return (
                <div
                  className={`${EBCSS.menu_item} ${menu.selected}`}
                  onClick={() => {
                    const newList = [...menuList]

                    newList.map((b) => {
                      b.selected = ''
                    })
                    newList[i].selected = 'on'
                    changeAutoNextPage(i === 0 ? true : false)
                    setMenuList(newList)
                    setIsShow(false)
                  }}
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
