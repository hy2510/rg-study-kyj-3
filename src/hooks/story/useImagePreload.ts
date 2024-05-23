import { useState } from 'react'

import { ImgSize, PageProps } from '@interfaces/IStory'

export default function useStoryImagePreload() {
  const [isPreloaded, setPreloaded] = useState<boolean>(false)
  const [imgSize, setImgSize] = useState<ImgSize>({
    width: 1,
    height: 1,
  })

  const preloadImage = (storyData: PageProps[]) => {
    if (!isPreloaded) {
      const distinctData = [...new Set(storyData.map((data) => data.ImagePath))]

      distinctData.map((data, i) => {
        const image = new Image()
        image.src = data

        if (i === 0 && data !== null) {
          setImgSize({
            width: image.width,
            height: image.height,
          })
        }

        if (i === distinctData.length - 1) {
          setPreloaded(true)
        }
      })
    }
  }

  return { imgSize, preloadImage }
}
