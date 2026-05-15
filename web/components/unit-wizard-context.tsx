'use client'

import { createContext, useContext } from 'react'

interface UnitWizardContextValue {
  currentStep: number
  totalSteps: number
}

export const UnitWizardContext = createContext<UnitWizardContextValue>({
  currentStep: 0,
  totalSteps: 4,
})

export function useUnitWizard(): UnitWizardContextValue {
  return useContext(UnitWizardContext)
}
