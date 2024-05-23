import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type BtnNextProps = {
  goTest: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function BtnNext({ goTest }: BtnNextProps) {
  return (
    <div
      className={`${style.btnNext} animate__animated animate__flash`}
      onClick={() => goTest()}
    >
      Next
    </div>
  )
}
