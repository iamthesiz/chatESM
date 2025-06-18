import { useRef, useCallback, useMemo } from 'react'
import useIdEffect from './useIdEffect'
import { useIdp } from './useIdp'

type ListenerMap = Map<string, EventListener>

type UseEventReturn = {
  ref: React.RefObject<HTMLDivElement>
  on: (event: string, handler: EventListener) => void
}

export function useEvent(providedId?: string): UseEventReturn {
  const id = useIdp(providedId)
  const ref = useRef<HTMLDivElement>(null)
  const listeners = useRef<ListenerMap>(new Map())

  const on = useCallback((event: string, handler: EventListener) => {
    if (!ref.current) {
      return console.warn(
        `[useEvent] Tried to bind '${event}' listener, but element not found. Did you forget to attach the ref or wait for the element to mount?`
      )
    }

    const oldHandler = listeners.current.get(event)
    if (oldHandler) {
      ref.current.removeEventListener(event, oldHandler)
    }

    ref.current.addEventListener(event, handler)
    listeners.current.set(event, handler)
  }, [])

  useIdEffect(id, () => {
    return (isLastUnmount: boolean) => {
      if (isLastUnmount && ref.current) {
        // Clean up all listeners on last unmount
        listeners.current.forEach((handler, event) => {
          ref.current!.removeEventListener(event, handler)
        })
        listeners.current.clear()
      }
    }
  }, [])

  return { ref, on }
}
