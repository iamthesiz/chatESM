import { useRef, useEffect } from 'react'
import { atom, useAtom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import useIdEffect from './useIdEffect'
import { useIdp } from './useIdp'

type ListenerMap = Map<string, EventListener>

const refsByID = new Map<string, React.RefObject<any>>()

const mountedAtomFamily = atomFamily((_id: string) => atom<boolean>(false))

// Custom return type with ref-like convenience methods
interface UseEventReturn<T extends HTMLElement = HTMLElement> {
  // The actual React ref for use in JSX
  for: React.RefObject<T>
  // Direct access to the element
  ref: T | null
  // Event handling
  on(event: 'mount', handler: (element: T) => void): void
  on(event: string, handler: EventListener): void
}

export function useEvent<T extends HTMLElement = HTMLElement>(providedId?: string): UseEventReturn<T> {
  const [, id] = useIdp(providedId)  // Use typeId
  const ref = useRef<T>(null)
  const listeners = useRef<ListenerMap>(new Map())
  const [isMounted, setIsMounted] = useAtom(mountedAtomFamily(id))
  const mountCheckInterval = useRef<NodeJS.Timeout | null>(null)

  if (!refsByID.has(id)) {
    refsByID.set(id, ref)
  }
  const sharedRef = refsByID.get(id)! as React.RefObject<T>
  const isRefOwner = useRef(false)

  const on = (event: string, handler?: EventListener | ((element: HTMLElement) => void)) => {
    if (event === 'mount') {
      if (!handler) {
        console.warn(`[useEvent] No handler provided for 'mount' event`)
        return
      }

      // If already mounted, call handler immediately
      if (isMounted && sharedRef.current) {
        (handler as (element: T) => void)(sharedRef.current)
      }

      // Mount detection is already running for ref owner (started when .for was accessed)
      // Non-ref owners just wait for the mount notification
      return
    }

    if (!handler) {
      console.warn(`[useEvent] No handler provided for '${event}' event`)
      return
    }

    if (!ref.current) {
      return console.warn(
        `[useEvent] Tried to bind '${event}' listener, but element not found. Did you forget to attach the ref or wait for the element to mount?`
      )
    }

    const oldHandler = listeners.current.get(event)
    if (oldHandler) {
      ref.current.removeEventListener(event, oldHandler)
    }

    ref.current.addEventListener(event, handler as EventListener)
    listeners.current.set(event, handler as EventListener)
  }

  useIdEffect(id, () => (isLastUnmount) => {
    if (isLastUnmount && ref.current) {
      refsByID.delete(id)
    }
    if (ref.current) {
      // Clean up all listeners on last unmount
      listeners.current.forEach((handler, event) => {
        ref.current!.removeEventListener(event, handler)
      })
      listeners.current.clear()
    }
  }, [])

  useEffect(() => {
    if (!isRefOwner.current) return

    if (sharedRef.current && !isMounted) {
      return setIsMounted(true)
    }

    // Start monitoring if not mounted
    if (!isMounted && !mountCheckInterval.current) {

      mountCheckInterval.current = setInterval(() => {
        if (sharedRef.current) {
          setIsMounted(true)
          if (mountCheckInterval.current) {
            clearInterval(mountCheckInterval.current)
            mountCheckInterval.current = null
          }
        }
      }, 10)

      // Stop polling after 5 seconds
      const timeout = setTimeout(() => {
        if (mountCheckInterval.current) {
          clearInterval(mountCheckInterval.current)
          mountCheckInterval.current = null
        }
      }, 5000)

      return () => {
        clearTimeout(timeout)
        if (mountCheckInterval.current) {
          clearInterval(mountCheckInterval.current)
          mountCheckInterval.current = null
        }
      }
    }
  }, [isMounted])

  const container: UseEventReturn<T> = {
    get for() {
      // Mark this instance as the ref owner so we only have 1 hook watching for mount
      if (!isRefOwner.current) {
        isRefOwner.current = true
      }
      return sharedRef
    },
    get ref() { return sharedRef.current },
    on
  }

  return container
}
