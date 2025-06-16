/* eslint-disable */
import { useEffect } from 'react'
import useHook from './useHook'

const unmounts = {}

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
 * @param {*} id - ID of the hook
 * @param {*} callback - useEffect callback function
 * @param {*} deps - dependencies for the useEffect
 */
const useIdEffect = (baseId, callback, deps = [], debug = false) => {
  const hook = useHook(baseId, 'useIdEffect')
  const id = hook.sharedId
  useEffect(() => {
    if (!unmounts[id]) {
      const unmount = callback(!unmounts[id])
      unmounts[id] = unmount ?? (() => { })
    } else {
      callback(!unmounts[id])
    }
    return () => {
      unmounts?.[id]?.(hook.lastToUnmount)
      if (hook.lastToUnmount) delete unmounts[id]
    }
  }, [...deps, id])
  return hook
}

export default useIdEffect
