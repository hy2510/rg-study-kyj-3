import { IWritingActivity2Writing } from '@interfaces/IWritingActivity'

type StepOutroProps = {
  mode: IWritingActivity2Writing['Mode']
  type: IWritingActivity2Writing['Type']
  currentSubmitCount: number
  maxSubmitCount: number
  submitWritingActivity: () => Promise<void>
  submitNoRevision: () => Promise<void>
}

import ModalRevisionEndOutro from './modal/ModalRevisionEndOutro'
import ModalRevisionRequire from './modal/ModalRevisionRequire'
import ModalRevisionSelect from './modal/ModalRevisionSelect'

export default function StepOutro({
  mode,
  type,
  currentSubmitCount,
  maxSubmitCount,
  submitWritingActivity,
  submitNoRevision,
}: StepOutroProps) {
  let outro

  switch (type) {
    case 'In School':
    case 'Overseas':
      switch (mode) {
        case 'All':
        case 'Free':
          if (maxSubmitCount - currentSubmitCount < 1) {
            outro = (
              <ModalRevisionEndOutro
                currentSubmitCount={currentSubmitCount}
                maxSubmitCount={maxSubmitCount}
                submitNoRevision={submitNoRevision}
              />
            )
          } else {
            if (mode === 'All') {
              // All은 첨삭
              outro = (
                <ModalRevisionRequire
                  currentSubmitCount={currentSubmitCount}
                  maxSubmitCount={maxSubmitCount}
                  submitWritingActivity={submitWritingActivity}
                />
              )
            } else {
              // Free는 첨삭할지 선택
              outro = (
                <ModalRevisionSelect
                  currentSubmitCount={currentSubmitCount}
                  maxSubmitCount={maxSubmitCount}
                  submitNoRevision={submitNoRevision}
                  submitWritingActivity={submitWritingActivity}
                />
              )
            }
          }
          break
        case 'Limit':
          if (maxSubmitCount - currentSubmitCount < 1) {
            // limit의 경우 기회가 부족하면 종료한다
            outro = (
              <ModalRevisionEndOutro
                currentSubmitCount={currentSubmitCount}
                maxSubmitCount={maxSubmitCount}
                submitNoRevision={submitNoRevision}
              />
            )
          } else {
            // limit의 경우 기회가 존재하면 무조건 첨삭을 받는다
            outro = (
              <ModalRevisionRequire
                currentSubmitCount={currentSubmitCount}
                maxSubmitCount={maxSubmitCount}
                submitWritingActivity={submitWritingActivity}
              />
            )
          }
          break
      }
      break

    case 'No Revision':
      if (maxSubmitCount - currentSubmitCount < 1) {
        // No Revision인 경우 기회가 없으면 종료
        outro = (
          <ModalRevisionEndOutro
            currentSubmitCount={currentSubmitCount}
            maxSubmitCount={maxSubmitCount}
            submitNoRevision={submitNoRevision}
          />
        )
      } else {
        // No Revision인 경우 기회가 존재하면 선택
        outro = (
          <ModalRevisionSelect
            currentSubmitCount={currentSubmitCount}
            maxSubmitCount={maxSubmitCount}
            submitNoRevision={submitNoRevision}
            submitWritingActivity={submitWritingActivity}
          />
        )
      }
      break
  }

  return <>{outro}</>
}
