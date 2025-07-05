import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { RefObject } from 'react'

interface MolstarState {
  molstar: any | null  // The Molstar plugin instance
  ref: RefObject<HTMLDivElement> | null  // DOM element reference
  loading: boolean  // Overall loading state (encompasses mounting, initializing, and structure loading)
}

/**
 * State management philosophy:
 * - mounting: Derived from !!container.ref (not stored in state)
 * - initializing: Tracked with a ref to avoid rerenders during plugin creation
 * - loading: The only state that triggers rerenders, encompasses all loading phases
 * 
 * The molstar plugin instance is stored in state for cleaner code and easier access.
 * Since it's just an object reference, it doesn't affect Jotai's reactivity.
 */

// Single atom family for all Molstar state by ID
export const molstarStateAtomFamily = atomFamily((_id: string) =>
  atom<MolstarState>({
    molstar: null,
    ref: null,
    loading: true,  // Starts true, becomes false when everything is ready
  })
)