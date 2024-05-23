import listeningCSS from '@stylesheets/listening-activity.module.scss'
import listeningCSSMobile from '@stylesheets/mobile/listening-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type ImgQuestionProps = {
  src: string
}

const isMobile = useDeviceDetection()

const style = isMobile ? listeningCSSMobile : listeningCSS

export default function ImgQuestion({ src }: ImgQuestionProps) {
  return (
    <div className={style.questionBox}>
      <img
        src={src}
        width={isMobile ? 'auto' : '250px'}
        height={isMobile ? '100%' : 'auto'}
      />
    </div>
  )
}
