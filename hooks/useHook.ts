// @ts-nocheck
import { useState, useRef, useLayoutEffect, useMemo } from 'react'
import { slug } from 'cuid'
import { useIdp } from './useIdp'
import { isUndefined } from 'lodash'

// when working with ID state, multiple hooks can be created
// that are all using the same ID. This means we need to make
// sure that some of our useEffects in our hooks are only being
// fired on the 1st mount of the 1st hook, and only unmounting
// certain things on the last hook to be unmounted. That is where
// the hookCount comes in.

// Global store for context-level data (shared across all hooks with same contextId)
const contextStore = new Map()

// Global store for type-level data (shared across all hooks with same typeId)
const typeStore = new Map()

const useHook = (ogId, ogType) => {
  let hasMounted = true

  // Get IDs from useIdp
  const [contextId, typeId] = useIdp(ogId, ogType)

  // Initialize context store for this contextId
  if (!contextStore.has(contextId)) {
    contextStore.set(contextId, {
      context: {},
      count: 0,
      types: 0, // active # of types in this context
      last: false
    })
  }

  // Initialize type store for this typeId
  if (!typeStore.has(typeId)) {
    typeStore.set(typeId, {
      count: 0,
      context: {},
      last: false
    })
    const ctx = contextStore.get(contextId)
    ctx.types++  // New type added
  }

  // Create a unique id for this specific instance
  const { instance, type, context } = useMemo(() => {
    const _type = typeStore.get(typeId)
    const _context = contextStore.get(contextId)

    ++_type.count
    ++_context.count

    const type = { ..._type, first: _type.count === 1, id: typeId }
    const context = { ..._context, first: _context.count === 1, id: contextId }

    const instance = `${contextId}--${type.count}-${ogType || 'hook'}--${slug()}`

    // Mark as not mounted yet
    hasMounted = false

    return { instance, type, context }
  }, []) // Empty deps - only run once

  const ctx = contextStore.get(contextId)

  const hook = useRef({
    // Context level
    first: context.first,  // first hook ever for this contextId
    count: context.count,  // which hook number this is for contextId
    context: ctx.context,
    types: ctx.types,  // active types in context
    id: contextId,  // contextId (base id)
    // Type level (nested object)
    type,
    instance,  // unique instance id of this hook
  })

  useLayoutEffect(() => () => {
    const [type, ctx] = [typeStore.get(typeId), contextStore.get(contextId)]


    // If we're the second to last, mark last for the remaining hook
    if (type.count === 2) {
      type.last = true

      // If only one type remains, mark context as last too
      if (ctx.types === 1) {
        ctx.last = true
      }
    }

    // Decrement instance count
    type.count--

    // Clean up if no instances remain
    if (type.count <= 0) {
      typeStore.delete(typeId)
      ctx.types--  // Type removed
    }

    // Check if this is the last hook using this context
    if (ctx.types === 0) {
      contextStore.delete(contextId)
    }
  }, [contextId, typeId])

  // used to identify if the 1st hook has mounted
  // true only on the 1st render of the 1st hook with the sharedId
  hook.current.firstMount = !hasMounted && hook.current.first
  // used to identify the 1st mount of each of the hooks
  // true only on the 1st render of any hook with the sharedId
  hook.current.hasMounted = hasMounted

  // Return merged object with dynamic values
  const typeData = typeStore.get(typeId)
  const ctxDataCurrent = contextStore.get(contextId)

  const result = {
    ...hook.current,
    last: typeData?.last || false,
    final: ctxDataCurrent?.last || false
  }

  return result
}

export default useHook
