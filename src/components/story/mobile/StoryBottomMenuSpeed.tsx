import { StoryMenuSpeedItemProps } from '@interfaces/IStory'

import style from '@stylesheets/e-book.module.scss'

import Label from './Label'
import SelectBox from './SelectBox'

type StoryBottomMenuSpeedProps = {
  speedList: StoryMenuSpeedItemProps[]
  changePlaySpeedList: (newSpeedList: StoryMenuSpeedItemProps[]) => void
  changePlaySpeed: (speed: number) => void
}

export default function StoryBottomMenuSpeed({
  speedList,
  changePlaySpeedList,
  changePlaySpeed,
}: StoryBottomMenuSpeedProps) {
  const selectedType = speedList.find((speed) => {
    return speed.selected === 'on'
  })

  const changePlayrate = (speedTypeIndex: number) => {
    const newList = [...speedList]

    newList.map((list) => {
      list.selected = ''
    })

    newList[speedTypeIndex].selected = 'on'

    changePlaySpeed(newList[speedTypeIndex].rate)
    changePlaySpeedList(newList)
  }

  return (
    <>
      <Label text={'읽기 속도'} />
      <SelectBox>
        {speedList.map((speed, i) => {
          return (
            <div
              className={`${style.select_button} ${
                speed.selected === 'on' ? style.on : ''
              }`}
              onClick={() => {
                changePlayrate(i)
              }}
            >
              <div className={style.radio}></div>
              {speed.rate}x
            </div>
          )
        })}
      </SelectBox>
    </>
  )
}
