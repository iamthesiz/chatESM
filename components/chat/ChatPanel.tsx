import styled from '@emotion/styled'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const Header = styled.header`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e5e7;
  flex-shrink: 0;
`

const Title = styled.h1`
  font-size: 1.125rem;
  font-weight: 600;
  color: #202123;
  margin: 0;
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`

const MessageGroup = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
  align-items: ${props => props.isUser ? 'flex-end' : 'flex-start'};
`

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background-color: ${props => props.isUser ? '#202123' : '#f7f7f8'};
  color: ${props => props.isUser ? '#ffffff' : '#202123'};
  font-size: 0.875rem;
  line-height: 1.5;
`

const InputContainer = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e5e7;
  flex-shrink: 0;
`

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: #f7f7f8;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
`

const Input = styled.input`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 0.875rem;
  color: #202123;
  
  &::placeholder {
    color: #8e8ea0;
  }
`

const SendButton = styled.button`
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: #8e8ea0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #202123;
  }
`

const mockMessages = [
  { id: '1', text: 'Can you help me analyze the structure of 1TQN?', isUser: true },
  { id: '2', text: 'I\'d be happy to help you analyze the structure of 1TQN. This is a trypsin-BPTI complex. Let me load the structure for you.', isUser: false },
  { id: '3', text: 'What are the key binding interactions?', isUser: true },
  { id: '4', text: 'The key interactions include several hydrogen bonds and a salt bridge between the inhibitor and the enzyme active site.', isUser: false },
]

export function ChatPanel() {
  return (
    <Container>
      <Header>
        <Title>Protein folding analysis</Title>
      </Header>
      <MessagesContainer>
        {mockMessages.map(message => (
          <MessageGroup key={message.id} isUser={message.isUser}>
            <MessageBubble isUser={message.isUser}>
              {message.text}
            </MessageBubble>
          </MessageGroup>
        ))}
      </MessagesContainer>
      <InputContainer>
        <InputWrapper>
          <Input 
            type="text" 
            placeholder="Send a message..." 
            disabled 
          />
          <SendButton disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </SendButton>
        </InputWrapper>
      </InputContainer>
    </Container>
  )
}