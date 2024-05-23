import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type QuestionBoxProps = {
  img: string
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function QuestionBox({ img }: QuestionBoxProps) {
  return (
    <div className={style.questionBox}>
      <div className={style.wordImage}>
        <img src={img} width={'100%'} />
      </div>
    </div>
  )
}
