import {
  tabsActivations,
  tabsOrientations,
  type TabsActivation,
  type TabsOrientation,
} from './tabs'
import { floatingPlacements, type FloatingPlacement } from './floating'
import { sheetPositions, type SheetPosition } from './sheet'

export type OverlayPlacement = FloatingPlacement

export function isTabsOrientation(value: string): value is TabsOrientation {
  return tabsOrientations.includes(value as TabsOrientation)
}

export function isTabsActivation(value: string): value is TabsActivation {
  return tabsActivations.includes(value as TabsActivation)
}

export function isOverlayPlacement(value: string): value is FloatingPlacement {
  return floatingPlacements.includes(value as FloatingPlacement)
}

export function isSheetPositionValue(value: string): value is SheetPosition {
  return sheetPositions.includes(value as SheetPosition)
}
