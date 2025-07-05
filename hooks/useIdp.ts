
import { useState } from 'react'
import cuid from 'cuid'

const idStore = new Map<string, [string, string]>()

/**
 * A hook to generate a typeId ID for a component.
 * Part of the ID Pattern.
 */
export const useIdp = (initialId?: string, type = 'default'): [string, string] => {
  const [ids] = useState<[string, string]>(() => {
    // Create a stable key for the store
    const storeKey = `${initialId || 'auto'}::${type}`
    const existing = idStore.get(storeKey)
    if (existing) return existing

    const contextId = initialId || cuid()
    const typeId = `${contextId}--${type}`
    const result: [string, string] = [contextId, typeId]
    idStore.set(storeKey, result)
    return result
  })

  return ids
}
