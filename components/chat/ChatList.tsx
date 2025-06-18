/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled'
import { useState } from 'react'
import * as Icons from 'react-icons/bi'
import * as Icons2 from 'react-icons/hi2'

const BiSidebar = Icons.BiSidebar as any
const HiOutlinePencilSquare = Icons2.HiOutlinePencilSquare as any
interface Chat {
  id: string
  title: string
  timestamp: Date
}

const mockChats: Chat[] = [
  { id: '1', title: 'Protein folding analysis', timestamp: new Date() },
  { id: '2', title: 'ESM-2 sequence design', timestamp: new Date() },
  { id: '3', title: 'Binding site prediction', timestamp: new Date() },
  { id: '4', title: 'Structure comparison', timestamp: new Date() },
]

interface ChatListProps {
  onToggleSidebar?: () => void
}

export function ChatList({ onToggleSidebar }: ChatListProps) {
  const [selectedChatId, setSelectedChatId] = useState<string>('1')

  return (
    <Container>
      <Header>
        <IconButton onClick={onToggleSidebar} title="Toggle sidebar">
          <BiSidebar />
        </IconButton>
        <IconButton title="New chat">
          <HiOutlinePencilSquare />
        </IconButton>
      </Header>
      <ChatItemsContainer>
        {mockChats.map(chat => (
          <ChatItem
            key={chat.id}
            isActive={chat.id === selectedChatId}
            onClick={() => setSelectedChatId(chat.id)}
          >
            {chat.title}
          </ChatItem>
        ))}
      </ChatItemsContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0.5rem;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #e5e5e7;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #202123;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`

const ChatItemsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`

const ChatItem = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.isActive ? '#ffffff' : '#202123'};
  background-color: ${props => props.isActive ? '#202123' : 'transparent'};
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background-color: ${props => props.isActive ? '#202123' : '#f7f7f8'};
  }
`
