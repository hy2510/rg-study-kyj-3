import EBCSS from '@stylesheets/e-book.module.scss'

type ChoseeRatingProps = {
  starCount: number
  changeStarCount: (count: number) => void
}

export default function ChooseRating({
  starCount,
  changeStarCount,
}: ChoseeRatingProps) {
  const count = [1, 2, 3, 4, 5]

  return (
    <div className={EBCSS.chooseRating}>
      {count.map((a, i) => {
        const num = i + 1

        return (
          <div
            key={i}
            className={starCount >= num ? EBCSS.btnStarOn : EBCSS.btnStarOff}
            onClick={() => {
              changeStarCount(num)
            }}
          ></div>
        )
      })}
    </div>
  )
}
