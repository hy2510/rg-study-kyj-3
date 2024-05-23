import { ReactNode, useContext, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { ACTIVITY } from '@constants/constant'
import { StudyTypeCode, Theme } from '@interfaces/Types'
import useCharacter from '@hooks/study/useCharacter'

// Quiz Activites - cloze test
import ClozeTest1 from '@pages/study/ClozeTest1'
import ClozeTest2 from '@pages/study/ClozeTest2'
import ClozeTest3 from '@pages/study/ClozeTest3'

// Quiz Activites - listening activity
import ListeningActivity1 from '@pages/study/ListeningActivity1'
import ListeningActivity2 from '@pages/study/ListeningActivity2'
import ListeningActivity3 from '@pages/study/ListeningActivity3'
import ListeningActivity4 from '@pages/study/ListeningActivity4'

// Quiz Activites - reading comprehension
import ReadingComprehension1 from '@pages/study/ReadingComprehension1'
import ReadingComprehension2 from '@pages/study/ReadingComprehension2'
import ReadingComprehension3 from '@pages/study/ReadingComprehension3'
import ReadingComprehension4 from '@pages/study/ReadingComprehension4'

// Quiz Activites - summary
import Summary1 from '@pages/study/Summary1'
import Summary2 from '@pages/study/Summary2'

// Quiz Activites - true or false
import TrueFalse from '@pages/study/TrueFalse'

// Quiz Activites - vocabulary
import VocabularyPractice1 from '@pages/study/VocabularyPractice1'
import VocabularyTest1 from '@pages/study/VocabularyTest1'
import VocabularyPractice2 from '@pages/study/VocabularyPractice2'
import VocabularyTest2 from '@pages/study/VocabularyTest2'
import VocabularyPractice3 from '@pages/study/VocabularyPractice3'
import VocabularyTest3 from '@pages/study/VocabularyTest3'
import VocabularyPractice4 from '@pages/study/VocabularyPractice4'
import VocabularyTest4 from '@pages/study/VocabularyTest4'

// Quiz Activites - writing activity
import WritingActivity1 from '@pages/study/WritingActivity1'
import WritingActivity2 from '@pages/study/WritingActivity2'

import '@stylesheets/theme.scss'
import quizTemplateCSS from '@stylesheets/quiz-template.module.scss'

export interface QuizContainerChildProps {
  currentStep: number
  onFinishActivity: () => void
}

const QuizContainer: React.FC<{}> = (props) => {
  const CHARACTER = useCharacter()
  const { studyInfo, bookInfo, handler } = useContext(
    AppContext,
  ) as AppContextProps

  const [currentStepId, setCurrentStepId] = useState<number>(
    studyInfo.startStep,
  )

  const [isEnabledPractice, setEnabledPractice] = useState(
    !studyInfo.isPassedVocabularyPractice,
  )

  const currentActivity = studyInfo.mappedStepActivity[currentStepId - 1]
  const getNextStepId = (): number | undefined => {
    const idx = studyInfo.openSteps.findIndex(
      (value) => value === currentStepId,
    )
    return idx >= 0 && studyInfo.openSteps.length > idx + 1
      ? studyInfo.openSteps[idx + 1]
      : undefined
  }

  const onCurrentActivityFinish = () => {
    const nextStepId = getNextStepId()

    if (nextStepId) {
      setCurrentStepId(nextStepId)
    } else {
      handler.actionFinishStudy(handler.finishStudy, CHARACTER)
    }
  }

  const changeVocaState = (isOn: boolean) => {
    setEnabledPractice(isOn)
  }

  const round = Number(bookInfo.BookCode.substring(6))
  let theme = ''

  if (studyInfo.bookType === 'EB') {
    if (bookInfo.BookLevel === 'KA') {
      /* KA themes: theme-jungle, theme-antarctica, theme-zoo-1, theme-zoo-2 */
      const themePool = [
        'theme-zoo-2',
        'theme-jungle',
        'theme-antarctica',
        'theme-zoo-1',
      ]

      theme = themePool[round % themePool.length]
    } else if (bookInfo.BookLevel === 'KB' || bookInfo.BookLevel === 'KC') {
      /* KB, KC themes: theme-forest, theme-kids-room, theme-space, theme-farm */
      const themePool = [
        'theme-farm',
        'theme-forest',
        'theme-kids-room',
        'theme-space',
      ]

      theme = themePool[round % themePool.length]
    }
  }

  if (theme === '') {
    /* 1C 이상 themes: theme-season-spring, theme-season-summer, theme-season-autumn, theme-season-winter, theme-playground, theme-camping */
    const themePool = [
      'theme-camping',
      'theme-season-spring',
      'theme-season-summer',
      'theme-season-autumn',
      'theme-season-winter',
      'theme-playground',
    ]

    theme = themePool[round % themePool.length]
  }

  const datas = {
    mode: studyInfo.mode,
    currentStep: currentStepId,
    studyId: studyInfo.studyId,
    studentHistoryId: studyInfo.studentHistoryId,
    bookType: studyInfo.bookType,
    studyTypeCode: (studyInfo.bookType === 'EB'
      ? '001006'
      : '001001') as StudyTypeCode,
    onFinishActivity: onCurrentActivityFinish,
    isEnabledPractice: studyInfo.isPassedVocabularyPractice,
    changeVocaState: changeVocaState,
    theme: theme as Theme,
    lastStep: studyInfo.openSteps[studyInfo.openSteps.length - 1],
    isReTestYn: studyInfo.isReTestYn,
  }

  let component: ReactNode = undefined

  switch (currentActivity) {
    case ACTIVITY.LISTENING_1:
      component = <ListeningActivity1 {...datas} />
      break
    case ACTIVITY.LISTENING_2:
      component = <ListeningActivity2 {...datas} />
      break
    case ACTIVITY.LISTENING_3:
      component = <ListeningActivity3 {...datas} />
      break
    case ACTIVITY.LISTENING_4:
      component = <ListeningActivity4 {...datas} />
      break
    case ACTIVITY.VOCABULARY_1:
      if (isEnabledPractice) {
        component = <VocabularyPractice1 {...datas} />
      } else {
        component = <VocabularyTest1 {...datas} />
      }
      break
    case ACTIVITY.VOCABULARY_2:
      if (isEnabledPractice) {
        component = <VocabularyPractice2 {...datas} />
      } else {
        component = <VocabularyTest2 {...datas} />
      }
      break
    case ACTIVITY.VOCABULARY_3:
      if (isEnabledPractice) {
        component = <VocabularyPractice3 {...datas} />
      } else {
        component = <VocabularyTest3 {...datas} />
      }
      break
    case ACTIVITY.VOCABULARY_4:
      if (isEnabledPractice) {
        component = <VocabularyPractice4 {...datas} />
      } else {
        component = <VocabularyTest4 {...datas} />
      }
      break
    case ACTIVITY.READING_COMP_1:
      component = <ReadingComprehension1 {...datas} />
      break
    case ACTIVITY.READING_COMP_2:
      component = <ReadingComprehension2 {...datas} />
      break
    case ACTIVITY.READING_COMP_3:
      component = <ReadingComprehension3 {...datas} />
      break
    case ACTIVITY.READING_COMP_4:
      component = <ReadingComprehension4 {...datas} />
      break
    case ACTIVITY.SUMMARY_1:
      component = <Summary1 {...datas} />
      break
    case ACTIVITY.SUMMARY_2:
      component = <Summary2 {...datas} />
      break
    case ACTIVITY.TRUE_OR_FALSE:
      component = <TrueFalse {...datas} />
      break
    case ACTIVITY.CLOZE_1:
      component = <ClozeTest1 {...datas} />
      break
    case ACTIVITY.CLOZE_2:
      component = <ClozeTest2 {...datas} />
      break
    case ACTIVITY.CLOZE_3:
      component = <ClozeTest3 {...datas} />
      break
    case ACTIVITY.WRITING_1:
      component = <WritingActivity1 {...datas} />
      break
    case ACTIVITY.WRITING_2:
      component = <WritingActivity2 {...datas} />
      break
  }

  return (
    <div className={`${quizTemplateCSS.quizTemplate} ${theme}`}>
      {component}
    </div>
  )
}
export default QuizContainer
