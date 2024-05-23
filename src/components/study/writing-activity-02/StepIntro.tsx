import { IWritingActivity2Writing } from '@interfaces/IWritingActivity'
import useCharacter from '@hooks/study/useCharacter'

type StepIntroProps = {
  mode: IWritingActivity2Writing['Mode']
  type: IWritingActivity2Writing['Type']
  currentSubmitCount: number
  maxSubmitCount: number
  goWritingActivity: () => void
  noWritingActivity: () => Promise<void>
}

import ModalWritingSelect from './modal/ModalWritingSelect'
import ModalWritingRequire from './modal/ModalWritingRequire'
import ModalRevisionEndIntro from './modal/ModalRevisionEndIntro'

export default function StepIntro({
  mode,
  type,
  currentSubmitCount,
  maxSubmitCount,
  goWritingActivity,
  noWritingActivity,
}: StepIntroProps) {
  const CHARACTER = useCharacter()
  let intro

  switch (type) {
    case 'In School':
    case 'Overseas':
      switch (mode) {
        case 'All':
          // All은 글쓰기 필수
          intro = (
            <ModalWritingRequire
              unit={CHARACTER}
              goWritingActivity={goWritingActivity}
            />
          )
          break
        case 'Free':
          // Free는 글쓰기 선택
          intro = (
            <ModalWritingSelect
              currentSubmitCount={currentSubmitCount}
              maxSubmitCount={maxSubmitCount}
              goWritingActivity={goWritingActivity}
              noWritingActivity={noWritingActivity}
            />
          )
          break
        case 'Limit':
          if (maxSubmitCount - currentSubmitCount < 1) {
            // limit의 경우 기회가 다 소진된 경우 종료하고
            intro = (
              <ModalRevisionEndIntro
                currentSubmitCount={currentSubmitCount}
                maxSubmitCount={maxSubmitCount}
                noWritingActivity={noWritingActivity}
              />
            )
          } else {
            // 기회가 있는 경우 선택
            intro = (
              <ModalWritingSelect
                currentSubmitCount={currentSubmitCount}
                maxSubmitCount={maxSubmitCount}
                goWritingActivity={goWritingActivity}
                noWritingActivity={noWritingActivity}
              />
            )
          }
          break
      }
      break

    case 'No Revision':
      // No revision의 경우 기회가 있든 없든 선택
      intro = (
        <ModalWritingSelect
          currentSubmitCount={currentSubmitCount}
          maxSubmitCount={maxSubmitCount}
          goWritingActivity={goWritingActivity}
          noWritingActivity={noWritingActivity}
        />
      )
      break
  }

  return <>{intro}</>
}
