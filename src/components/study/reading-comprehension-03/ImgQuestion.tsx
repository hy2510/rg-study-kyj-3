import readingComprehensionCSS from '@stylesheets/reading-comprehension.module.scss'
import readingComprehensionCSSMobile from '@stylesheets/mobile/reading-comprehension.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type ImgQuestionProps = {
  src: string
}

const isMobile = useDeviceDetection()

const style = isMobile ? readingComprehensionCSSMobile : readingComprehensionCSS

export default function ImgQuestion({ src }: ImgQuestionProps) {
  return (
    <div className={style.questionImage}>
      <img
        src={src}
        width={isMobile ? 'auto' : '100%'}
        height={isMobile ? '100%' : 'auto'}
      />
    </div>
  )
}
