import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const HIGHLIGHTS = [
  'Фиксированные 30-минутные слоты с 09:00 до 18:00.',
  'Проверка конфликта при бронировании.',
  'Просмотр предстоящих событий в отдельном разделе.',
]

type HomePageProps = {
  onStart: () => void
}

export function HomePage({ onStart }: HomePageProps) {
  return (
    <main className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(112deg,#e6efff_0%,#eff5ff_32%,#fdf3ea_70%,#fde7d6_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:items-start lg:py-24">
        <div>
          <span className="inline-flex rounded-full bg-card/80 px-3 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Быстрая запись на звонок
          </span>
          <h1 className="mt-5 text-5xl font-bold tracking-tight sm:text-6xl">
            Calendar
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            Один экран, понятные слоты, быстрая бронь. Выберите время и
            запишитесь на звонок без лишних шагов.
          </p>
          <Button
            type="button"
            className="mt-8 h-11 px-5 font-semibold"
            onClick={onStart}
          >
            Записаться
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <Card className="bg-card shadow-sm [--card-spacing:--spacing(6)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Что доступно прямо сейчас
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
