import EBCSS from '@stylesheets/e-book.module.scss'

type SelectBoxProps = {
  children: JSX.Element[]
}

export default function SelectBox({ children }: SelectBoxProps) {
  return <div className={EBCSS.select_box}>{children}</div>
}
