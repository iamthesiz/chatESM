import { useEffect, useRef } from "react";
import useHook from "./useHook";
// import { Molstar } from "@molstar/mol-plugin-ui";
import { createPluginUI } from 'molstar/lib/mol-plugin-ui'
import useIdEffect from "./useIdEffect";
import { atom, useAtom } from "jotai";
import { atomFamily } from "jotai/utils";

const moleculeFamily = atomFamily((id: string) =>
  atom({
    loading: true,
    structure: null,
  })
)

export const useMolstar = (id: string) => {
  const molstar = useRef<Awaited<ReturnType<typeof createPluginUI>>>(null);
  const [state, setState] = useAtom(moleculeFamily(id))

  useIdEffect(id, async (isFirstMount) => {
    if (isFirstMount) {
      const view = document.getElementById(id)
      if (view) {
        molstar.current = await createPluginUI({
          target: view,
          render: (component, container) => {
            // React render function
            return component;
          }
        })
      }
    }
    return (isLastUnmount) => {
      if (isLastUnmount && molstar.current) {
        molstar.current.dispose()
      }
    }
  }, [id])

  const load = async (url: string, format: string) => {
    molstar.current.loading = true
    await molstar.current.loadStructureFromUrl(url, format)
    molstar.current.loading = false
  }

  const molecule = {
    ...state,
    load,
    ...molstar.current,
  }
  return [molecule, setState]
}
