import React, { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { createPluginUI } from 'molstar/lib/mol-plugin-ui'
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18'
import { DefaultStructureTools } from 'molstar/lib/mol-plugin-ui/controls'
import { MoleculeInstance } from '../../useMolstar/types'

interface NativeMolstarControlsProps {
  molecule: MoleculeInstance
}

const Container = styled.div`
  padding: 16px;
  
  /* Override Molstar's default styles */
  .msp-layout-standard {
    border: none !important;
    background: transparent !important;
  }
  
  .msp-layout-left-panel {
    background: transparent !important;
    border: none !important;
    width: 100% !important;
  }
  
  .msp-control-row {
    margin: 8px 0;
  }
  
  .msp-control-group-wrapper {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
  }
  
  .msp-control-group-header {
    background: #f8f9fa;
    padding: 12px 16px;
    font-weight: 600;
    font-size: 14px;
    color: #2d3748;
    border-bottom: 1px solid #e2e8f0;
    cursor: pointer;
    
    &:hover {
      background: #f1f3f5;
    }
  }
  
  .msp-control-group-content {
    padding: 12px 16px;
  }
  
  .msp-btn, .msp-btn-flat {
    padding: 6px 12px;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    color: #4a5568;
    
    &:hover {
      background: #f7fafc;
      border-color: #cbd5e0;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .msp-btn-flat {
    border: none;
    background: transparent;
    
    &:hover {
      background: #f7fafc;
    }
  }
  
  .msp-form-control, select {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 13px;
    background: white;
    
    &:focus {
      outline: none;
      border-color: #4299e1;
    }
  }
  
  .msp-slider {
    width: 100%;
    margin: 8px 0;
  }
  
  /* Hide unnecessary Molstar UI elements */
  .msp-viewport-controls,
  .msp-plugin-context-menu,
  .msp-toast-container,
  .msp-transformer-wrapper {
    display: none !important;
  }
`

export function NativeMolstarControls({ molecule }: NativeMolstarControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<any>(null)
  
  useEffect(() => {
    if (!containerRef.current || !molecule.plugin) return
    
    // Create a minimal plugin UI just for the controls
    const initPlugin = async () => {
      try {
        const plugin = await createPluginUI({
          target: containerRef.current!,
          render: renderReact18,
          spec: {
            layout: {
              initial: {
                isExpanded: true,
                showControls: true,
                controlsDisplay: 'reactive' as const,
                regionState: {
                  left: 'full',
                  top: 'hidden',
                  right: 'hidden',
                  bottom: 'hidden'
                }
              }
            },
            components: {
              viewport: { enabled: false },
              remoteState: 'none' as const
            }
          }
        })
        
        pluginRef.current = plugin
        
        // Share the same state with the main molecule plugin
        if (molecule.plugin && molecule.plugin.state) {
          plugin.state = molecule.plugin.state
        }
      } catch (error) {
        console.error('Failed to initialize native controls:', error)
      }
    }
    
    initPlugin()
    
    return () => {
      if (pluginRef.current) {
        pluginRef.current.dispose()
        pluginRef.current = null
      }
    }
  }, [molecule.plugin])
  
  return <Container ref={containerRef} />
}