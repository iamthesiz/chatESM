import { useState, useEffect } from 'react'
import { useMolstar } from './useMolstar'
import { BACKGROUND_COLOR_MAP, NAMED_COLORS } from '../utils/molstar-selections'
import { adjustColorBrightness } from '../utils'

export interface BackgroundState {
  color: string
  rgb: number
}

export type SetBackground = (background: string, lighten?: number, darken?: number) => void

export function useBackground(id?: string): [BackgroundState, SetBackground] {
  const molstar = useMolstar(id)
  const [state, setState] = useState<BackgroundState>({
    color: '#ffffff',
    rgb: 0xffffff
  })

  // Helper to set renderer props
  const setRenderer = (renderer: any, redraw = false) => {
    if (!molstar?.loaded) return
    molstar.canvas.setProps({ renderer: { ...molstar.renderer, ...renderer } })
    if (redraw) {
      molstar.canvas.commit(true)
      molstar.draw()
    }
  }

  // Initialize state from molstar
  useEffect(() => {
    if (!molstar?.loaded || !molstar?.canvas) return
    
    const currentBg = molstar.canvas.props.renderer?.backgroundColor ?? 0xffffff
    const colorHex = BACKGROUND_COLOR_MAP[currentBg] || 
      '#' + currentBg.toString(16).padStart(6, '0')
    
    setState({
      color: colorHex,
      rgb: currentBg
    })
  }, [molstar?.loaded])

  const setBackground: SetBackground = (background, lighten, darken) => {
    if (!molstar?.loaded || !background) return
    
    // Handle special cases
    if (background === 'transparent') {
      // Molstar doesn't truly support transparent, but we can set to white with alpha
      setRenderer({ backgroundColor: 0xffffff }, true)
      setState({ color: 'transparent', rgb: 0xffffff })
      return
    }
    
    const baseColor = NAMED_COLORS[background] || parseInt(background.replace('#', ''), 16)
    const backgroundColor = adjustColorBrightness(baseColor, lighten, darken)
    
    setRenderer({ backgroundColor }, true)
    
    // Update state
    const colorHex = '#' + backgroundColor.toString(16).padStart(6, '0')
    setState({
      color: colorHex,
      rgb: backgroundColor
    })
  }

  return [state, setBackground]
}