// @ts-nocheck
import { useState, useRef, useLayoutEffect, useMemo } from 'react'
import { slug } from 'cuid'

// when working with ID state, multiple hooks can be created
// that are all using the same ID. This means we need to make
// sure that some of our useEffects in our hooks are only being
// fired on the 1st mount of the 1st hook, and only unmounting
// certain things on the last hook to be unmounted. That is where
// the hookCount comes in.
let hookCount = {}
const useHook = (ogId, unique) => {
  let hasMounted = true
  const [id] = useState(() => {
    let id = ogId || slug()
    if (unique) id = `${id}--${unique}`
    if (ogId) id = `${id}--${slug()}`
    hasMounted = false
    return id
  })

  const hook = useRef({
    // used to identify the 1st hook
    first: typeof hookCount[id] === 'undefined',
    lastToUnmount: false,
    current: {} as any,
    // ID shared amongst all the hooks associated
    sharedId: id,
    count: 0,
    id: ''
  })

  if (typeof hookCount[id] === 'undefined') {
    hookCount[id] = -1
    hook.current.lastToUnmount = false
  }

  // amount of hooks associated with the provided shared state ID
  hook.current.count = useMemo(() => ++hookCount[id], [id])
  // individual hook ID associated with this exact hook
  hook.current.id = useMemo(() => `${hook.current.count}---${id}`, [id, unique])

  useLayoutEffect(() => () => {
    --hookCount[id]
    // console.log('useHook --- UNMOUNTING 🛑🛑❌❌', hookCount[id], hook.current)
    if (hookCount[id] < 0) {
      hook.current.lastToUnmount = true
      delete hookCount[id]
    }
  }, [id])

  // used to identify if the 1st hook has mounted
  // true only on the 1st render of the 1st hook with the sharedId
  hook.current.firstMount = !hasMounted && hook.current.first
  // used to identify the 1st mount of each of the hooks
  // true only on the 1st render of any hook with the sharedId
  hook.current.hasMounted = hasMounted
  // console.log('useHook ID', hook.current.id, hookCount[id])
  return hook.current
}

export default useHook
