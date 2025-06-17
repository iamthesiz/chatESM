import React, { createContext, useContext, useRef, useState, useCallback } from 'react'
import { createPluginUI } from 'molstar/lib/mol-plugin-ui'
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18'
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context'

interface MolstarInstance {
  id: string
  plugin: PluginUIContext | null
  container: HTMLElement | null
  loading: boolean
  error: Error | null
  structure: {
    id: string
    name: string
    url?: string
  } | null
}

interface MolstarContextType {
  instances: Map<string, MolstarInstance>
  createInstance: (id: string, container: HTMLElement) => Promise<void>
  destroyInstance: (id: string) => void
  loadStructure: (id: string, url: string, format?: string, name?: string) => Promise<void>
  getInstance: (id: string) => MolstarInstance | undefined
  resetCamera: (id: string) => void
  screenshot: (id: string) => Promise<string | undefined>
  setRepresentation: (id: string, type: 'cartoon' | 'ball-and-stick' | 'surface') => void
}

const MolstarContext = createContext<MolstarContextType | null>(null)

export function MolstarProvider({ children }: { children: React.ReactNode }) {
  const [instances] = useState(() => new Map<string, MolstarInstance>())
  const [, forceUpdate] = useState({})
  
  const triggerUpdate = useCallback(() => {
    forceUpdate({})
  }, [])

  const createInstance = useCallback(async (id: string, container: HTMLElement) => {
    if (instances.has(id)) {
      console.warn(`Molstar instance ${id} already exists`)
      return
    }

    const instance: MolstarInstance = {
      id,
      plugin: null,
      container,
      loading: true,
      error: null,
      structure: null
    }

    instances.set(id, instance)
    triggerUpdate()

    try {
      const plugin = await createPluginUI({
        target: container,
        render: renderReact18,
        spec: {
          behaviors: [],
          layout: {
            initial: {
              isExpanded: false,
              showControls: false,
              controlsDisplay: 'reactive' as const,
            }
          },
          components: {
            remoteState: 'none' as const
          },
          config: []
        }
      })

      instance.plugin = plugin
      instance.loading = false
      triggerUpdate()
    } catch (error) {
      instance.error = error as Error
      instance.loading = false
      triggerUpdate()
    }
  }, [instances, triggerUpdate])

  const destroyInstance = useCallback((id: string) => {
    const instance = instances.get(id)
    if (instance?.plugin) {
      instance.plugin.dispose()
    }
    instances.delete(id)
    triggerUpdate()
  }, [instances, triggerUpdate])

  const loadStructure = useCallback(async (id: string, url: string, format = 'mmcif', name?: string) => {
    const instance = instances.get(id)
    if (!instance?.plugin) return

    instance.loading = true
    triggerUpdate()

    try {
      await instance.plugin.clear()
      
      await instance.plugin.dataTransaction(async () => {
        const data = await instance.plugin!.builders.data.download({
          url,
          isBinary: false
        })
        
        const trajectory = await instance.plugin!.builders.structure.parseTrajectory(data, format)
        await instance.plugin!.builders.structure.hierarchy.applyPreset(trajectory, 'default')
      })

      instance.structure = {
        id: url,
        name: name || url.split('/').pop() || 'Unknown',
        url
      }
      instance.loading = false
      triggerUpdate()
    } catch (error) {
      instance.error = error as Error
      instance.loading = false
      triggerUpdate()
    }
  }, [instances, triggerUpdate])

  const getInstance = useCallback((id: string) => {
    return instances.get(id)
  }, [instances])

  const resetCamera = useCallback((id: string) => {
    const instance = instances.get(id)
    if (instance?.plugin?.canvas3d) {
      instance.plugin.canvas3d.resetCamera()
    }
  }, [instances])

  const screenshot = useCallback(async (id: string): Promise<string | undefined> => {
    const instance = instances.get(id)
    if (!instance?.plugin?.canvas3d) return

    const imageData = await instance.plugin.canvas3d.getImageData()
    return imageData.canvas.toDataURL('image/png')
  }, [instances])

  const setRepresentation = useCallback((id: string, type: 'cartoon' | 'ball-and-stick' | 'surface') => {
    const instance = instances.get(id)
    if (!instance?.plugin) return

    // This is a simplified version - you'd implement the actual representation change here
    console.log(`Setting representation to ${type} for instance ${id}`)
  }, [instances])

  const value: MolstarContextType = {
    instances,
    createInstance,
    destroyInstance,
    loadStructure,
    getInstance,
    resetCamera,
    screenshot,
    setRepresentation
  }

  return (
    <MolstarContext.Provider value={value}>
      {children}
    </MolstarContext.Provider>
  )
}

export function useMolstarContext() {
  const context = useContext(MolstarContext)
  if (!context) {
    throw new Error('useMolstarContext must be used within MolstarProvider')
  }
  return context
}