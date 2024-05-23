import { useContext, useEffect, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import sideMenuCSS from '@stylesheets/side-menu.module.scss'

import { IScoreBoardData } from '@interfaces/Common'

type StudySideMenuProps = {
  isSideOpen: boolean
  currentStep: number | string
  currentStepType: string
  quizLength: number
  maxAnswerCount: number
  scoreBoardData: IScoreBoardData[]
  changeSideMenu: (state: boolean) => void
}

import icon_repeat from '@assets/images/story/repeat.svg'
import icon_delete from '@assets/images/story/delete.svg'
import icon_exit from '@assets/images/story/exite.svg'

import SideMenuScoreBoard from './side-menu/SideMenuScoreBoard'

export default function StudySideMenu({
  isSideOpen,
  currentStep,
  currentStepType,
  quizLength,
  maxAnswerCount,
  scoreBoardData,
  changeSideMenu,
}: StudySideMenuProps) {
  const { bookInfo, handler } = useContext(AppContext) as AppContextProps

  const [sideAnim, setSideAnim] = useState<
    'animate__fadeIn' | 'animate__fadeOut'
  >('animate__fadeIn')
  const [containerAnim, setContainerAnim] = useState<
    'animate__slideInRight' | 'animate__slideOutRight'
  >()

  useEffect(() => {
    setSideAnim('animate__fadeIn')
    setContainerAnim('animate__slideInRight')
  }, [isSideOpen])

  const closeMenu = () => {
    setSideAnim('animate__fadeOut')
    setContainerAnim('animate__slideOutRight')

    setTimeout(() => {
      changeSideMenu(false)
    }, 300)
  }

  return (
    <>
      {isSideOpen && (
        <div
          id="study-side-menu"
          className={`${sideMenuCSS.study_side_menu} ${sideAnim}`}
        >
          <div
            id="study-side-menu-container"
            className={`${sideMenuCSS.study_side_menu_container} ${containerAnim}`}
          >
            <div className={sideMenuCSS.study_side_menu_area_top}>
              <div className={sideMenuCSS.close_side_menu}>
                <div
                  className={sideMenuCSS.btn_delete}
                  onClick={() => {
                    closeMenu()
                  }}
                >
                  <img src={icon_delete} alt="" />
                </div>
              </div>

              <div className={sideMenuCSS.book_info}>
                <div className={sideMenuCSS.book_code}>{bookInfo.BookCode}</div>
                <div className={sideMenuCSS.book_title}>{bookInfo.Title}</div>
              </div>

              {bookInfo.BookCode.includes('EB') && (
                <div className={sideMenuCSS.select_study_menu}>
                  <div
                    className={`${sideMenuCSS.select_study_menu_item}`}
                    onClick={() => {
                      handler.changeView('story')
                    }}
                  >
                    <img src={icon_repeat} alt="" />
                    다시 읽기
                    <div className="pyro">
                      <div className="before"></div>
                      <div className="after"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 보고있는 화면이 퀴즈인 경우 */}
              <SideMenuScoreBoard
                currentStep={currentStep}
                currentStepType={currentStepType}
                quizLength={quizLength}
                maxAnswerCount={maxAnswerCount}
                scoreBoardData={scoreBoardData}
              />
            </div>
            <div className={sideMenuCSS.study_side_menu_area_bottom}>
              <div
                className={sideMenuCSS.btn_exit}
                onClick={() => {
                  try {
                    window.onExitStudy()
                  } catch (e) {
                    location.replace('/')
                  }
                }}
              >
                <img src={icon_exit} alt="" />
                <div className="txt">나가기</div>
              </div>
            </div>
          </div>
          <div
            className={sideMenuCSS.screen_block}
            onClick={() => closeMenu()}
          ></div>
        </div>
      )}
    </>
  )
}
