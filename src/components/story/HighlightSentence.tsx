type HLSentenceProps = {
  pageNumber: number
  sentence: string
  sequence: number
  marginTop: number
  color: string
  clickSentence: (page: number, sequence: number) => void
}

export default function HighlightSentence({
  pageNumber,
  sentence,
  marginTop,
  sequence,
  color,
  clickSentence,
}: HLSentenceProps) {
  const convertSentence = (sentence: string) => {
    const sentenceIDReg = /id=\"t/g

    const convertedSentence = sentence.replace(
      sentenceIDReg,
      `style='margin-top: ${marginTop}px; background-color:${color}' id="t_${pageNumber}_`,
    )

    return convertedSentence
  }

  const onClickHandler = () => {
    if (sequence !== 999) clickSentence(pageNumber, sequence)
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: convertSentence(sentence) }}
      onClick={() => onClickHandler()}
    ></div>
  )
}
