import { useCallback, useEffect, useRef } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { leftPanelWidthAtom, isDraggingAtom } from '../state'

export const useResize = () => {
  const [leftWidth, setLeftWidth] = useAtom(leftPanelWidthAtom)
  const [isDragging, setIsDragging] = useAtom(isDraggingAtom)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
    
    // Constrain between 20% and 80%
    const constrainedWidth = Math.min(Math.max(newLeftWidth, 20), 80)
    setLeftWidth(constrainedWidth)

    // Dispatch resize event for Molstar
    const moleculePanel = containerRef.current.querySelector('[data-molecule-panel]')
    if (moleculePanel) {
      const resizeEvent = new Event('resize', { bubbles: true })
      moleculePanel.dispatchEvent(resizeEvent)
    }
  }, [isDragging, setLeftWidth])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, setIsDragging])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return {
    containerRef,
    leftWidth,
    isDragging
  }
}