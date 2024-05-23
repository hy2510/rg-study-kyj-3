import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IWritingActivity1Example } from '@interfaces/IWritingActivity'

import CardExample from './CardExample'

type WrapperExampleProps = {
  exampleRefs: React.MutableRefObject<HTMLDivElement[]>
  exampleData: IWritingActivity1Example[]
  selectWord: (index: number, selectedWord: string) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function WrapperExample({
  exampleRefs,
  exampleData,
  selectWord,
}: WrapperExampleProps) {
  return (
    <div className={style.answers}>
      {exampleData.map((example, i) => {
        return (
          <CardExample
            exampleRefs={exampleRefs}
            index={i}
            example={example}
            selectWord={selectWord}
          />
        )
      })}
    </div>
  )
}
