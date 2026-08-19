/** Permitted values for `ui-tabs` `orientation`. */
export const tabsOrientations = ['horizontal', 'vertical'] as const
export type TabsOrientation = (typeof tabsOrientations)[number]

/** Permitted values for `ui-tabs` `activation`. */
export const tabsActivations = ['automatic', 'manual'] as const
export type TabsActivation = (typeof tabsActivations)[number]
