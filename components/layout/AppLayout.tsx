import styled from '@emotion/styled'
import { ReactNode } from 'react'

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f7f7f8;
  overflow: hidden;
`

const LeftSection = styled.div`
  display: flex;
  flex: 0 0 680px;
  background-color: #ffffff;
  border-right: 1px solid #e5e5e7;
`

const ChatListPanel = styled.aside`
  width: 260px;
  background-color: #f7f7f8;
  border-right: 1px solid #e5e5e7;
  display: flex;
  flex-direction: column;
`

const ChatPanel = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
`

const MoleculePanel = styled.section`
  flex: 1;
  background-color: #ffffff;
  border-left: 1px solid #e5e5e7;
  display: flex;
  flex-direction: column;
`

interface AppLayoutProps {
  chatList: ReactNode
  chat: ReactNode
  molecule: ReactNode
}

export function AppLayout({ chatList, chat, molecule }: AppLayoutProps) {
  return (
    <LayoutContainer>
      <LeftSection>
        <ChatListPanel>{chatList}</ChatListPanel>
        <ChatPanel>{chat}</ChatPanel>
      </LeftSection>
      <MoleculePanel>{molecule}</MoleculePanel>
    </LayoutContainer>
  )
}