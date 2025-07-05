import { useRef, useEffect } from 'react'
import { atom, useAtom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import useIdEffect from './useIdEffect'
import { useIdp } from './useIdp'

type ListenerMap = Map<string, EventListener>

// Module-level storage for refs by ID
const refsByID = new Map<string, React.RefObject<any>>()

// Shared atom family for mount notifications by ID (just boolean for rerenders)
const mountedAtomFamily = atomFamily((_id: string) => atom<boolean>(false))

// Custom return type with ref-like convenience methods
interface UseEventReturn<T extends HTMLElement = HTMLElement> {
  // The actual React ref for use in JSX
  for: React.RefObject<T>

  // Ref accessor
  ref: T | null      // Direct access to the element

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

  // Get the shared ref for this ID, or create it
  if (!refsByID.has(id)) {
    refsByID.set(id, ref)
  }
  const sharedRef = refsByID.get(id)! as React.RefObject<T>
  const isRefOwner = useRef(false)  // Track if this instance owns the ref

  // Add unique ID to track ref instances
  const refId = useRef(Math.random().toString(36).substring(7))

  const on = (event: string, handler?: EventListener | ((element: HTMLElement) => void)) => {
    // Special handling for 'mount' event
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

    // Regular event handling
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

  useIdEffect(id, () => {
    return (isLastUnmount: boolean) => {
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
    }
  }, [])

  // Ref owner monitors for mount
  useEffect(() => {
    if (!isRefOwner.current) return

    // Check if already mounted
    if (sharedRef.current && !isMounted) {
      setIsMounted(true)
      return
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
          console.error(`[useEvent] Mount timeout for ref owner ${refId.current} (ID: ${id})`)
          clearInterval(mountCheckInterval.current)
          mountCheckInterval.current = null
        }
      }, 5000)

      // Cleanup on unmount
      return () => {
        clearTimeout(timeout)
        if (mountCheckInterval.current) {
          clearInterval(mountCheckInterval.current)
          mountCheckInterval.current = null
        }
      }
    }
  }, [isMounted])

  // Create container object with all our methods
  const container: UseEventReturn<T> = {
    get for() {
      // Mark this instance as the ref owner when .for is accessed
      if (!isRefOwner.current) {
        isRefOwner.current = true
      }
      // The ref owner uses the shared ref
      return sharedRef
    },
    get ref() { return sharedRef.current },      // Direct access to element
    on
  }

  return container
}
