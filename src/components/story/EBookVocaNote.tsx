import { useContext, useEffect, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import EBCSS from '@stylesheets/e-book.module.scss'

type EBookVocaNoteProps = {
  isVocaOpen: boolean
  playState: PlayState
  changeVocaOpen: (state: boolean) => void
  pauseStoryAudio: () => void
  resumeStoryAudio: () => void
}

import { EbookVocaList } from './EBookVocaList'

import icon_delete_black from '@assets/images/story/icon_delete_black.svg'
import icon_printer from '@assets/images/story/icon_printer.svg'
import { PlayState } from '@interfaces/IStory'

export default function EBookVocaNote({
  isVocaOpen,
  playState,
  changeVocaOpen,
  pauseStoryAudio,
  resumeStoryAudio,
}: EBookVocaNoteProps) {
  const { bookInfo } = useContext(AppContext) as AppContextProps

  const [noteAnim, setNoteAnim] = useState<
    'animate__fadeOut' | 'animate__fadeIn'
  >('animate__fadeIn')
  const [containerAnim, setContainerAnim] = useState<
    'animate__slideInRight' | 'animate__slideOutRight'
  >('animate__slideInRight')

  useEffect(() => {
    setNoteAnim('animate__fadeIn')
    setContainerAnim('animate__slideInRight')
  }, [isVocaOpen])

  const closeVoca = () => {
    setNoteAnim('animate__fadeOut')
    setContainerAnim('animate__slideOutRight')

    setTimeout(() => {
      if (playState === 'play') {
        resumeStoryAudio()
      }

      changeVocaOpen(false)
    }, 300)
  }

  return (
    <>
      {isVocaOpen && (
        <>
          <div
            className={`${EBCSS.ebook_vocabulary_note} animate__animated ${noteAnim}`}
          >
            <div
              id="ebook-vocabulary-note-container"
              className={`${EBCSS.ebook_vocabulary_note_container} animate__animated ${containerAnim}`}
            >
              <div className={EBCSS.ebook_vocabulary_note_area_top}>
                <div className={EBCSS.close_vocabulary_note}>
                  {bookInfo.VocabularyPath && (
                    <div
                      className={EBCSS.btn_print}
                      onClick={() => {
                        window.open(bookInfo.VocabularyPath)
                      }}
                    >
                      <img src={icon_printer} alt="" />
                    </div>
                  )}
                  <div
                    className={EBCSS.btn_delete}
                    onClick={() => {
                      closeVoca()
                    }}
                  >
                    <img src={icon_delete_black} alt="" />
                  </div>
                </div>
                <div className={EBCSS.book_info}>
                  <div className={EBCSS.book_code}>{bookInfo.BookCode}</div>
                  <div className={EBCSS.book_title}>{bookInfo.Title}</div>
                </div>
                <div className={EBCSS.line}></div>
                <div className={EBCSS.voca_list}>
                  <EbookVocaList
                    playState={playState}
                    pauseStoryAudio={pauseStoryAudio}
                    resumeStoryAudio={resumeStoryAudio}
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            className={EBCSS.ebook_vocabulary_note_screen_block}
            onClick={() => {
              closeVoca()
            }}
          ></div>
        </>
      )}
    </>
  )
}
