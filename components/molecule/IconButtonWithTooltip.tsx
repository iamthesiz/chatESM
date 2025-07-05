import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import { sleep } from '../../utils'

interface TooltipContextType {
  activeTooltip: string | null
  setActiveTooltip: React.Dispatch<React.SetStateAction<string | null>>
}

export const TooltipContext = React.createContext<TooltipContextType>({
  activeTooltip: null,
  setActiveTooltip: () => { }
})

interface IconButtonWithTooltipProps {
  id: string
  title: string
  onClick: () => void
  children: React.ReactNode
}

export function IconButtonWithTooltip({ id, title, onClick, children }: IconButtonWithTooltipProps) {
  const { activeTooltip, setActiveTooltip } = React.useContext(TooltipContext)
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipText, setTooltipText] = useState(title)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isActive = activeTooltip === id

  const updateTooltipPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      })
    }
  }

  const handleClick = async () => {
    onClick()
    setTooltipText('Copied!')
    await sleep(1500)
    setTooltipText(title)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    updateTooltipPosition()
    setActiveTooltip(id)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (activeTooltip === id) {
      setActiveTooltip(null)
    }
  }

  useEffect(() => {
    if (!isHovered) {
      setTooltipText(title)
    }
  }, [isHovered, title])

  useEffect(() => {
    if (isActive && isHovered) {
      const handleScroll = updateTooltipPosition
      const handleResize = updateTooltipPosition

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isActive, isHovered])

  return (
    <>
      <IconButton
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </IconButton>
      {isActive && isHovered && createPortal(
        <Tooltip
          visible={isActive && isHovered}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        >
          {tooltipText}
        </Tooltip> as any,
        document.body
      )}
    </>
  )
}

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  svg {
    width: 16px;
    height: 16px;
    color: #718096;
  }
  
  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
    
    svg {
      color: #4a5568;
    }
  }
`

const Tooltip = styled.div<{ visible: boolean; x: number; y: number }>`
  position: fixed;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: #2d3748;
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.15s;
  z-index: 999999;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 4px 4px 4px;
    border-color: transparent transparent #2d3748 transparent;
  }
`
