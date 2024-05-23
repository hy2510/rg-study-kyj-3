import { useContext, useEffect, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import style from '@stylesheets/e-book.module.scss'

import icon_speak from '@assets/images/ebook/icon_speaker.svg'

import { useStoryAudioWord } from '@hooks/story/useStoryAudioWord'

import { IStudyData } from '@interfaces/Common'
import { PlayState } from '@interfaces/IStory'
import {
  getVocabularyPractice1,
  getVocabularyPractice2,
  getVocabularyPractice3,
  getVocabularyPractice4,
} from '@services/quiz/VocabularyAPI'
import {
  IVocabulary1Practice,
  IVocabulary2Practice,
  IVocabulary3Practice,
  IVocabulary4,
} from '@interfaces/IVocabulary'

type EbookVocaListProps = {
  playState: PlayState
  pauseStoryAudio: () => void
  resumeStoryAudio: () => void
}

export const EbookVocaList = ({
  playState,
  pauseStoryAudio,
  resumeStoryAudio,
}: EbookVocaListProps) => {
  const { studyInfo } = useContext(AppContext) as AppContextProps
  const [vocaData, setVocaData] = useState<
    | IVocabulary1Practice
    | IVocabulary2Practice
    | IVocabulary3Practice
    | IVocabulary4
  >()

  const { playAudio } = useStoryAudioWord({
    playState,
    pauseStoryAudio,
    resumeStoryAudio,
  })

  useEffect(() => {
    const getVocaData = async () => {
      const datas: IStudyData = {
        mode: studyInfo.mode,
        currentStep: 2,
        studyId: studyInfo.studyId,
        studentHistoryId: studyInfo.studentHistoryId,
        bookType: studyInfo.bookType,
        studyTypeCode: studyInfo.bookType === 'EB' ? '001006' : '001001',
        onFinishActivity: () => {},
        isEnabledPractice: studyInfo.isPassedVocabularyPractice,
        changeVocaState: () => {},
        theme: 'theme-antarctica',
        lastStep: studyInfo.allSteps[studyInfo.allSteps.length - 1],
        isReTestYn: studyInfo.isReTestYn,
      }

      switch (studyInfo.mappedStepActivity[1]) {
        case 'Vocabulary1':
          setVocaData(await getVocabularyPractice1(datas))
          break
        case 'Vocabulary2':
          setVocaData(await getVocabularyPractice2(datas))
          break
        case 'Vocabulary3':
          setVocaData(await getVocabularyPractice3(datas))
          break
        case 'Vocabulary4':
          setVocaData(await getVocabularyPractice4(datas))
          break
      }
    }

    if (!vocaData) getVocaData()
  }, [])

  return (
    <div className={style.ebook_voca_list}>
      {vocaData?.Quiz.map((word, i) => {
        let mean = ''

        switch (vocaData.MainMeanLanguage.toLowerCase()) {
          case 'korean':
            mean = word.Question.Korean
          case 'chinese':
            mean = word.Question.Chinese
          case 'japanese':
            mean = word.Question.Japanese
          case 'vietnamese':
            mean = word.Question.Vietnamese
          case 'indonesian':
            mean = word.Question.Indonesian
          case 'english':
            mean = word.Question.Britannica ? word.Question.Britannica : ''
        }

        return (
          <div className={style.voca_item}>
            <div className={style.word_item}>
              <div className={style.word}>{word.Question.Text}</div>
              <img
                src={icon_speak}
                alt=""
                onClick={() => {
                  playAudio(word.Question.Sound)
                }}
              />
            </div>
            <div className={style.mean}>{mean}</div>
          </div>
        )
      })}
    </div>
  )
}
