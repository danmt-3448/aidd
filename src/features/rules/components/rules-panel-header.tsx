import { montserrat } from '@/features/kudos/fonts'

interface RulesPanelHeaderProps {
  title: string
}

/** Fixed title block at top of rules panel. Figma: "Thể lệ" 45px/52lh Montserrat 700 #FFEA9E */
export function RulesPanelHeader({ title }: RulesPanelHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1
        className={`${montserrat.className} text-[45px] font-bold leading-[52px] tracking-[0px]`}
        style={{ color: '#FFEA9E' }}
      >
        {title}
      </h1>
    </div>
  )
}
