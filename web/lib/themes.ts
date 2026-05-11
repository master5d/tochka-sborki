export interface Theme {
  id: string
  label: string
}

export const themes: Theme[] = [
  { id: 'model-kit', label: 'Модель для сборки' },
]

export const defaultTheme = 'model-kit'
