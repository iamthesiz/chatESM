import styled from '@emotion/styled'

export const Container = styled.div`
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
`

export const Section = styled.div`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

export const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  
  svg {
    opacity: 0.6;
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    color: #1a202c;
  }
`