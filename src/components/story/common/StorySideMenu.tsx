import { useContext, useEffect, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import sideMenuCSS from '@stylesheets/side-menu.module.scss'

type StorySideMenuProps = {
  isSideOpen: boolean
  changeSideMenu: (state: boolean) => void
  changeRatingShow: (state: boolean) => void
  toggleMovieShow: (isShow: boolean) => void
}

import icon_book from '@assets/images/story/book.svg'
import icon_repeat from '@assets/images/story/repeat.svg'
import icon_quiz from '@assets/images/story/check_board.svg'
import icon_delete from '@assets/images/story/delete.svg'
import icon_speak from '@assets/images/story/rec.svg'
import icon_exit from '@assets/images/story/exite.svg'
import icon_movie from '@assets/images/story/movie_book.svg'

export default function StorySideMenu({
  isSideOpen,
  changeSideMenu,
  changeRatingShow,
  toggleMovieShow,
}: StorySideMenuProps) {
  const { studyInfo, bookInfo, handler } = useContext(
    AppContext,
  ) as AppContextProps

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

  const closeHeader = () => {
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
          className={`${sideMenuCSS.study_side_menu} animate__animated ${sideAnim}`}
        >
          <div
            className={`${sideMenuCSS.study_side_menu_container} animate__animated ${containerAnim}`}
          >
            <div className={sideMenuCSS.study_side_menu_area_top}>
              <div className={sideMenuCSS.close_side_menu}>
                <div
                  className={sideMenuCSS.btn_delete}
                  onClick={() => {
                    closeHeader()
                  }}
                >
                  <img src={icon_delete} alt="" />
                </div>
              </div>
              <div className={sideMenuCSS.book_info}>
                <div className={sideMenuCSS.book_code}>{bookInfo.BookCode}</div>
                <div className={sideMenuCSS.book_title}>{bookInfo.Title}</div>
              </div>

              <div className={sideMenuCSS.select_study_menu}>
                <div
                  className={`${sideMenuCSS.select_study_menu_item} ${sideMenuCSS.go_on} `}
                  onClick={() => {
                    if (handler.isPreference) {
                      handler.changeView('quiz')
                    } else {
                      if (handler.isReadingComplete) {
                        // 책을 끝까지 읽었으면
                        changeSideMenu(false)
                        changeRatingShow(true)
                      } else {
                        // 책을 끝까지 읽지 않았으면
                      }
                    }
                  }}
                >
                  <img src={icon_quiz} alt="" />
                  학습하기
                </div>
              </div>
              {(bookInfo.AnimationPath !== '' ||
                studyInfo.isAvailableSpeaking) && (
                <div className={sideMenuCSS.label}>보너스 학습</div>
              )}

              <div className={sideMenuCSS.ebook_more_activity}>
                {bookInfo.AnimationPath !== '' && (
                  <>
                    <div
                      className={sideMenuCSS.ebook_more_activity_item}
                      onClick={() => {
                        changeSideMenu(false)
                        toggleMovieShow(true)
                      }}
                    >
                      <img src={icon_movie} alt="" />
                      무비 시청
                    </div>
                  </>
                )}
                {studyInfo.isAvailableSpeaking && (
                  <>
                    <div
                      className={sideMenuCSS.ebook_more_activity_item}
                      onClick={() => {
                        handler.changeView('speaking')
                      }}
                    >
                      <img src={icon_speak} alt="" />
                      SPEAK (말하기 연습)
                    </div>
                  </>
                )}
              </div>
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
            onClick={() => closeHeader()}
          ></div>
        </div>
      )}
    </>
  )
}
