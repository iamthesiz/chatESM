import styled from '@emotion/styled'
import { useSetAtom } from 'jotai'
import { isDraggingAtom } from '../../state'
import { useCallback } from 'react'

export const ResizeHandle = () => {
  const setIsDragging = useSetAtom(isDraggingAtom)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [setIsDragging])

  return <Handle onMouseDown={handleMouseDown} />
}

const Handle = styled.div`
  width: 4px;
  height: 100%;
  background-color: #e5e5e7;
  cursor: col-resize;
  transition: background-color 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: #d1d1d3;
  }

  &:active {
    background-color: #b8b8bb;
  }
`
