import styled from '@emotion/styled'
import { useState } from 'react'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0.5rem;
`

const NewChatButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #e5e5e7;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #202123;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f7f7f8;
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

export function ChatList() {
  const [selectedChatId, setSelectedChatId] = useState<string>('1')

  return (
    <Container>
      <NewChatButton>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New chat
      </NewChatButton>
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