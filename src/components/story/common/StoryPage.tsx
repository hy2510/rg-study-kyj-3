import { useEffect, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import { StoryPageProps, PageProps } from '@interfaces/IStory'

import EBCSS from '@stylesheets/e-book.module.scss'

import Sentence from './Sentence'
import HighlightSentence from '../HighlightSentence'

export default function StoryPage({
  isTextShow,
  pageSeq,
  pageNumber,
  storyData,
  currentTime,
  readCnt,
  isHighlight,
  clickSentence,
}: StoryPageProps) {
  const { handler, bookInfo } = useContext(AppContext) as AppContextProps

  const [css, setCss] = useState<string>('')
  const [sentencesData, setSentenceData] = useState<PageProps[]>()
  const [image, setImage] = useState<string>()
  // Book Level Type 구분 (2024-02-13 12:30 호열)
  const bookLevel = bookInfo.BookLevel.substring(0, 1) || 'K'

  const [slideAni, setSlideAni] = useState('')
  const [currentPageNum, setCurrentPageNum] = useState(pageNumber)

  useEffect(() => {}, [isTextShow])

  useEffect(() => {
    if (storyData) {
      // css
      const pageCss = storyData.find(
        (data) => data.Page === pageNumber && data.Sequence === 999,
      )?.Css

      if (pageCss) {
        // style css
        const cssIDReg = /\#t/g
        const convertedCss = pageCss.replace(cssIDReg, `#t_${pageNumber}_`)

        setCss(convertedCss)
      }
      // css end

      // image
      const imagePath = storyData.find(
        (data) => data.Page === pageNumber && data.Sequence === 999,
      )?.ImagePath

      // sentence
      const sentences = storyData.filter((data) => data.Page === pageNumber)

      setImage(imagePath)
      setSentenceData(sentences)

      if (currentPageNum < pageNumber) {
        setCurrentPageNum(pageNumber)
        setSlideAni('slide-in-right')
        setTimeout(() => {
          setSlideAni('')
        }, 100)
      } else {
        setCurrentPageNum(pageNumber)
        setSlideAni('slide-in-left')
        setTimeout(() => {
          setSlideAni('')
        }, 100)
      }
    }
  }, [pageNumber])

  return (
    <div className={`${EBCSS.ebook_page} ${slideAni}`}>
      <div
        className={EBCSS.text_wrapper}
        style={{
          backgroundImage: `url(${image})`,
          width: bookLevel.toUpperCase() === 'K' ? '480px' : '525px',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: css }}></div>

        {sentencesData &&
          isTextShow &&
          sentencesData.map((data) => {
            if (
              pageSeq.playPage === pageNumber &&
              data.Sequence !== 999 &&
              currentTime >= data.StartTime / 1000 &&
              currentTime <= data.EndTime / 1000 &&
              isHighlight
            ) {
              return (
                <HighlightSentence
                  pageNumber={pageNumber}
                  sequence={data.Sequence}
                  sentence={data.Contents}
                  marginTop={data.MarginTop}
                  color={data.FontColor}
                  clickSentence={clickSentence}
                />
              )
            } else if (
              handler.storyMode === 'ListenAndRepeat' &&
              readCnt === 2
            ) {
              return (
                <Sentence
                  pageNumber={pageNumber}
                  sequence={data.Sequence}
                  sentence={data.Contents}
                  marginTop={data.MarginTop}
                  clickSentence={clickSentence}
                />
              )
            } else {
              return (
                <Sentence
                  pageNumber={pageNumber}
                  sequence={data.Sequence}
                  sentence={data.Contents}
                  marginTop={data.MarginTop}
                  clickSentence={clickSentence}
                />
              )
            }
          })}
      </div>
    </div>
  )
}
