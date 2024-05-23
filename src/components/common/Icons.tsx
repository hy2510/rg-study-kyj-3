import hbg_menu_black from '@assets/images/icons/icon_hbg_menu_black.svg'
import play_button_red from '@assets/images/icons/icon_play_red.svg'
import stop_button_gray from '@assets/images/icons/icon_stop_gray.svg'
import timer from '@assets/images/icons/icon_timer.svg'
import heart from '@assets/images/icons/icon_heart.svg'
import chev_right from '@assets/images/icons/icon_chev_right.svg'
import chev_left from '@assets/images/icons/icon_chev_left.svg'
import returnIcon from '@assets/images/icons/icon_return.svg'
import arrow_up from '@assets/images/icons/icon_arrow_up.svg'
import arrow_right from '@assets/images/icons/arrow-right_white.svg'

type IconProps = {
  width: number
  height: number
}

type IconWithColorProps = IconProps & {
  isColor: boolean
}

export const IcoHbgMenu = ({ width, height, isColor }: IconWithColorProps) => {
  return (
    <>{isColor && <img src={hbg_menu_black} width={width} height={height} />}</>
  )
}

export const IcoPlay = ({ width, height, isColor }: IconWithColorProps) => {
  return (
    <>
      {isColor && <img src={play_button_red} width={width} height={height} />}
    </>
  )
}

export const IcoStop = ({ width, height, isColor }: IconWithColorProps) => {
  return (
    <>
      {isColor && <img src={stop_button_gray} width={width} height={height} />}
    </>
  )
}

export const IcoTimer = ({ width, height, isColor }: IconWithColorProps) => {
  return <>{isColor && <img src={timer} width={width} height={height} />}</>
}

export const IcoHeart = ({ width, height, isColor }: IconWithColorProps) => {
  return <>{isColor && <img src={heart} width={width} height={height} />}</>
}

export const IcoChevRight = ({
  width,
  height,
  isColor,
}: IconWithColorProps) => {
  return (
    <>{isColor && <img src={chev_right} width={width} height={height} />}</>
  )
}

export const IcoChevLeft = ({ width, height, isColor }: IconWithColorProps) => {
  return <>{isColor && <img src={chev_left} width={width} height={height} />}</>
}

export const IcoReturn = ({ width, height }: IconProps) => {
  return (
    <>
      <img src={returnIcon} width={width} height={height} />
    </>
  )
}

export const IcoNext = ({ width, height }: IconProps) => {
  return (
    <>
      <img src={returnIcon} width={width} height={height} />
    </>
  )
}

export const IcoArrowRight = ({ width, height }: IconProps) => {
  return (
    <>
      <img src={arrow_right} width={width} height={height} />
    </>
  )
}

export const IcoArrowUp = ({ width, height, isColor }: IconWithColorProps) => {
  return <>{isColor && <img src={arrow_up} width={width} height={height} />}</>
}
