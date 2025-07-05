/* eslint-disable */
import { useEffect } from 'react'
import useHook from './useHook'

const unmounts = {}

const parseIdParam = (idParam) => {
  if (Array.isArray(idParam)) {
    const [contextId, typeId] = idParam
    return [contextId, typeId]
  }
  return [idParam, 'useIdEffect']
}

/**
 * @description
 * This calls useEffect on the 1st hook with the given ID
 * And it calls un-mount on the last hook with the given ID
 *
 * @todo
 * handle the case when there is not a useIdState ID created
 * this should be able to work independantly of whether you
 * useIdState or not.
 *
 * @example
 * // Using string format (context-level)
 * useIdEffect('my-list-id', isFirstHookMount => {
 *     if (isFirstHookMount) {
 *       // runs 1 time per ID.
 *       // first hook with this ID (such as a 1st item in a list)
 *     } else {
 *       // regular useEffect - when dependencies update
 *     }
 *   return isLastHookUnmount => {
 *     if (isLastHookUnmount) {
 *       // runs 1 time per ID.
 *       // Aka 1 time for the entire list the list
 *     } else {
 *       // regular useEffect
 *       // when each individual item unmounts,
 *       // this will run for each item
 *     }}
 *   }
 * }, [dependencies, sameAsUseEffect])
 *
 * @example
 * // Using array format (type-level)
 * useIdEffect(['my-list-id', 'item-component'], isFirstHookMount => {
 *   // Logic for specific component type
 * }, [deps])
 *
 * @param {string|Array} idParam - ID of the hook (string) or [contextId, typeId] (array)
 * @param {*} callback - useEffect callback function
 * @param {*} deps - dependencies for the useEffect
 */
const useIdEffect = (idParam, callback, deps = [], debug = false) => {
  const [contextId, typeId] = parseIdParam(idParam)
  const hook = useHook(contextId, typeId)
  const id = hook.id;
  useEffect(() => {
    if (!unmounts[id]) {
      const unmount = callback(!unmounts[id])
      unmounts[id] = unmount ?? (() => { })
    } else {
      callback(false)
    }
    return () => {
      if (typeof unmounts?.[id] === 'function') {
        unmounts?.[id]?.(hook.last)
      }
      if (hook.last) delete unmounts[id]
    }
  }, [...deps, id])
  return hook
}

export default useIdEffect
