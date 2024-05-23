import EBCSS from '@stylesheets/e-book.module.scss'

type StoryBodyProps = {
  children: JSX.Element[]
}

export default function StoryBody({ children }: StoryBodyProps) {
  const containerScale = (window.innerHeight - 100) / 750

  return (
    <div className={EBCSS.ebook_body_pc}>
      <div className={EBCSS.ebook_contents}>
        <div
          style={{ transform: `scale(${containerScale})` }}
          className={`${EBCSS.pages}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
