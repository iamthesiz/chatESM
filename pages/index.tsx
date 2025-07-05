import { ChatList } from '../components/chat/ChatList'
import { Chat } from '../components/chat/Chat'
import { MoleculeViewer } from '../components/molecule/MoleculeViewer'
import { ResizeHandle } from '../components/layout/ResizeHandle'
import styled from '@emotion/styled'
import { useToggles } from 'toggles'
import * as BiIcons from 'react-icons/bi'

const BiSidebar = BiIcons.BiSidebar as any
import { useResize } from '../hooks/useResize'

export default function Home() {
  const [{ sidebar }, { toggle }] = useToggles(false) // false = sidebar is initially closed

  return (
    <LayoutContainer>
      <MainContent>
        <LeftSection>
          <SidebarToggle onClick={() => toggle(sidebar)} title="Toggle sidebar">
            <BiSidebar />
          </SidebarToggle>
          <ChatListPanel isOpen={!sidebar.isOpen}>
            <ChatList sidebar={sidebar} />
          </ChatListPanel>
          <ChatPanel hasSidebar={sidebar.isOpen}>
            <Chat />
          </ChatPanel>
        </LeftSection>
        <ResizeHandle />
        <MoleculePanel data-molecule-panel>
          <MoleculeViewer />
        </MoleculePanel>
      </MainContent>
    </LayoutContainer>
  )
}

const LayoutContainer = styled.div`
  height: 100vh;
  width: 100vw;
  background-color: #f7f7f8;
  overflow: hidden;
`

const MainContentBase = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`

const LeftSectionBase = styled.div<{ width: number }>`
  display: flex;
  height: 100%;
  background-color: #ffffff;
  position: relative;
  flex: 0 0 ${props => props.width}%;
  min-width: 0;
`

const MainContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { containerRef } = useResize()
  return <MainContentBase ref={containerRef}>{children}</MainContentBase>
}

const LeftSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { leftWidth } = useResize()
  return <LeftSectionBase width={leftWidth}>{children}</LeftSectionBase>
}


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

const ChatListPanel = styled.aside<{ isOpen: boolean }>`
  width: ${props => props.isOpen ? '0' : '260px'};
  background-color: #f7f7f8;
  border-right: ${props => props.isOpen ? 'none' : '1px solid #e5e5e7'};
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
  min-width: 0;
`
