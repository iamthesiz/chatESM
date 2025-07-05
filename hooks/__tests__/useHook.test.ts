import { renderHook, act } from '@testing-library/react-hooks'
import useHook from '../useHook'

// Reset the module state before each test
beforeEach(() => {
  jest.resetModules()
})

describe('useHook', () => {
  it('should assign stable numbers to hooks even across remounts', () => {
    // First mount of useHook with unique 'test1'
    const { result: hook1, unmount: unmount1 } = renderHook(() => 
      useHook('test-id', 'test1')
    )
    
    expect(hook1.current.contextId).toBe('test-id')
    expect(hook1.current.typeId).toBe('test-id--test1')
    expect(hook1.current.id).toBe('1-test-id--1-test1')
    expect(hook1.current.count).toBe(1)
    
    // First mount of useHook with unique 'test2'
    const { result: hook2 } = renderHook(() => 
      useHook('test-id', 'test2')
    )
    
    expect(hook2.current.id).toBe('2-test-id--1-test2')
    expect(hook2.current.count).toBe(2)
    
    // Unmount and remount the first hook
    unmount1()
    
    const { result: hook1Remount } = renderHook(() => 
      useHook('test-id', 'test1')
    )
    
    // Should get the same position (1) but increment type count (2)
    expect(hook1Remount.current.id).toBe('1-test-id--2-test1')
    expect(hook1Remount.current.count).toBe(1) // Same position
  })
  
  it('should share context between hooks with same contextId', () => {
    const { result: hook1 } = renderHook(() => 
      useHook('shared-id', 'hook1')
    )
    
    const { result: hook2 } = renderHook(() => 
      useHook('shared-id', 'hook2')
    )
    
    // Both should share the same context object
    expect(hook1.current.context).toBe(hook2.current.context)
    
    // Modify context from hook1
    hook1.current.context.testValue = 'shared data'
    
    // Should be visible in hook2
    expect(hook2.current.context.testValue).toBe('shared data')
  })
  
  it('should not share context between different contextIds', () => {
    const { result: hook1 } = renderHook(() => 
      useHook('id-1', 'test')
    )
    
    const { result: hook2 } = renderHook(() => 
      useHook('id-2', 'test')
    )
    
    // Should have different context objects
    expect(hook1.current.context).not.toBe(hook2.current.context)
  })
  
  it('should correctly identify first hook', () => {
    const { result: hook1 } = renderHook(() => 
      useHook('test-id', 'first')
    )
    
    const { result: hook2 } = renderHook(() => 
      useHook('test-id', 'second')
    )
    
    expect(hook1.current.first).toBe(true)
    expect(hook2.current.first).toBe(false)
  })
  
  it('should correctly identify last hook to unmount', () => {
    const { result: hook1, rerender: rerender1, unmount: unmount1 } = renderHook(() => 
      useHook('test-id', 'hook1')
    )
    
    const { result: hook2, rerender: rerender2, unmount: unmount2 } = renderHook(() => 
      useHook('test-id', 'hook2')
    )
    
    // Initially neither should be last
    expect(hook1.current.lastToUnmount).toBe(false)
    expect(hook2.current.lastToUnmount).toBe(false)
    
    // Unmount hook1
    unmount1()
    
    // Force rerender of hook2 to update lastToUnmount
    rerender2()
    
    // Now hook2 should be marked as last
    expect(hook2.current.lastToUnmount).toBe(true)
  })
  
  it('should clean up context when last hook unmounts', () => {
    const { result: hook1, unmount: unmount1 } = renderHook(() => 
      useHook('cleanup-test', 'hook1')
    )
    
    const { result: hook2, unmount: unmount2 } = renderHook(() => 
      useHook('cleanup-test', 'hook2')
    )
    
    // Get reference to shared context
    const sharedContext = hook1.current.context
    
    // Add some data to verify cleanup
    sharedContext.testData = 'test'
    
    // Unmount first hook
    unmount1()
    
    // Context should still exist
    expect(hook2.current.context).toBe(sharedContext)
    
    // Unmount second (last) hook
    unmount2()
    
    // Create a new hook with same ID
    const { result: newHook } = renderHook(() => 
      useHook('cleanup-test', 'new')
    )
    
    // Should have a fresh context (not the old one)
    expect(newHook.current.context).not.toBe(sharedContext)
    expect(newHook.current.context.testData).toBeUndefined()
  })
})