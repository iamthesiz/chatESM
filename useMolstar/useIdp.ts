
import { useState } from 'react'
import cuid from 'cuid'

const idStore = new Map<string, string>()

/**
 * A hook to generate a unique ID for a component.
 * Part of the ID Pattern.
 */
export const useIdp = (initialId?: string, key = 'default'): string => {
  const [id] = useState(() => {
    const existing = idStore.get(key)
    if (existing) return existing

    const newId = initialId || cuid()
    idStore.set(key, newId)
    return newId
  })

  return id
}
