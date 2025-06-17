import styled from '@emotion/styled'
import { ReactNode, useState, useRef, useEffect } from 'react'
import { useToggles } from 'toggles'
import { BiSidebar } from 'react-icons/bi'

const LayoutContainer = styled.div<{ isDragging: boolean }>`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f7f7f8;
  overflow: hidden;
  cursor: ${props => props.isDragging ? 'col-resize' : 'default'};
  user-select: ${props => props.isDragging ? 'none' : 'auto'};
`

const LeftSection = styled.div<{ width: number }>`
  display: flex;
  flex: 0 0 ${props => props.width}px;
  background-color: #ffffff;
  position: relative;
`

const SidebarToggle = styled.button`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: #ffffff;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    color: #202123;
    background: #f7f7f8;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`

const ChatListPanel = styled.aside<{ isCollapsed: boolean }>`
  width: ${props => props.isCollapsed ? '0' : '260px'};
  background-color: #f7f7f8;
  border-right: ${props => props.isCollapsed ? 'none' : '1px solid #e5e5e7'};
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
`


const ChatPanel = styled.main<{ hasSidebar: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  padding-left: ${props => props.hasSidebar ? '0' : '48px'};
  transition: padding-left 0.3s ease;
`

const MoleculePanel = styled.section`
  flex: 1;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
`

const ResizeHandle = styled.div`
  width: 4px;
  background-color: #e5e5e7;
  cursor: col-resize;
  position: relative;
  transition: background-color 0.2s;

  &:hover {
    background-color: #d1d1d3;
  }

  &:active {
    background-color: #b8b8bb;
  }
`

interface AppLayoutProps {
  chatList: (props: { onToggleSidebar: () => void }) => ReactNode
  chat: ReactNode
  molecule: ReactNode
}

export function AppLayout({ chatList, chat, molecule }: AppLayoutProps) {
  const [nouns, verbs] = useToggles(false) // false = sidebar is initially closed
  const sidebar = nouns[0]
  const [leftSectionWidth, setLeftSectionWidth] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const handleToggleSidebar = () => {
    verbs.toggle(sidebar)
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      
      // Set minimum and maximum widths
      const minWidth = 400
      const maxWidth = containerRect.width - 400
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setLeftSectionWidth(newWidth)
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])
  
  return (
    <LayoutContainer ref={containerRef} isDragging={isDragging}>
      <LeftSection width={leftSectionWidth}>
        <SidebarToggle onClick={handleToggleSidebar} title="Toggle sidebar">
          <BiSidebar />
        </SidebarToggle>
        <ChatListPanel isCollapsed={!sidebar.isShown}>
          {chatList({ onToggleSidebar: handleToggleSidebar })}
        </ChatListPanel>
        <ChatPanel hasSidebar={sidebar.isShown}>{chat}</ChatPanel>
      </LeftSection>
      <ResizeHandle onMouseDown={handleMouseDown} />
      <MoleculePanel>{molecule}</MoleculePanel>
    </LayoutContainer>
  )
}