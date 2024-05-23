type SelectButtonReadTypeProps = {
  name: string
  onChangeReadType: (index: number) => {}
  active?: boolean
}

export default function SelectButtonReadType({
  name,
  onChangeReadType,
  active,
}: SelectButtonReadTypeProps) {
  return (
    <div
      className={active ? 'select-button on' : 'select-button'}
      onClick={() => onChangeReadType}
    >
      <div className="radio"></div>
      {name}
    </div>
  )
}
