# useEvent

Hook for managing DOM element references and lifecycle events across multiple components. This enables multiple components/hooks to attach to the same DOM element using a shared event system.

## Usage

```typescript
import { useEvent } from '../hooks/useEvent'

function MoleculeContainer() {
  const container = useEvent<HTMLDivElement>('viewer-1')
  
  // The container provides a ref callback
  return <div ref={container.for} />
}

function ControlPanel() {
  const container = useEvent<HTMLDivElement>('viewer-1')
  
  // Access the same container from another component
  useEffect(() => {
    if (container.ref) {
      console.log('Container dimensions:', {
        width: container.ref.offsetWidth,
        height: container.ref.offsetHeight
      })
    }
  }, [container.ref])
  
  return <div>Controls here</div>
}
```

## API

### Parameters

- `id: string` - Unique identifier for the event container
- `T: HTMLElement type` - Type of the HTML element (default: HTMLElement)

### Return Value

Returns an event container object:

```typescript
interface EventContainer<T> {
  ref: T | null           // Current DOM element reference
  for: RefCallback<T>     // Ref callback to attach to elements
  on: (event: string, handler: Function) => void    // Add event listener

## Examples

### Basic Usage

```typescript
function App() {
  // Main component creates the container
  const container = useEvent<HTMLDivElement>('main-viewer')
  
  return (
    <div>
      <div ref={container.for} style={{ width: '100%', height: '500px' }}>
        {/* Molstar will be rendered here */}
      </div>
      <SomeOtherComponent />
    </div>
  )
}

function SomeOtherComponent() {
  // Another component can access the same container
  const container = useEvent<HTMLDivElement>('main-viewer')
  
  useEffect(() => {
    if (container.ref) {
      // Do something with the container element
      const rect = container.ref.getBoundingClientRect()
      console.log('Container size:', rect.width, rect.height)
    }
  }, [container.ref])
  
  return null
}
```

### Mount/Unmount Events

```typescript
function ComponentA() {
  const container = useEvent<HTMLDivElement>('shared-container')
  
  useEffect(() => {
    const handleMount = () => {
      console.log('Container mounted!')
    }
    
    const handleUnmount = () => {
      console.log('Container unmounted!')
    }
    
    container.on('mount', (ref) => {
      // DOM node received
    })
  }, [])
  
  return <div ref={container.for} />
}
```

### Conditional Rendering

```typescript
function ConditionalContainer() {
  const [show, setShow] = useState(true)
  const container = useEvent<HTMLDivElement>('conditional')
  
  useEffect(() => {
    const handleMount = () => console.log('Mounted')
    const handleUnmount = () => console.log('Unmounted')
    
    container.on('mount', handleMount)
    container.on('unmount', handleUnmount)
    
    return () => {
      container.off('mount', handleMount)
      container.off('unmount', handleUnmount)
    }
  }, [])
  
  return (
    <div>
      <button onClick={() => setShow(!show)}>Toggle</button>
      {show && <div ref={container.for}>Content</div>}
    </div>
  )
}
```

## Built-in Events

- `mount` - Fired when element is attached to DOM
- `unmount` - Fired when element is removed from DOM

## Use Cases

1. **Shared DOM References**: Multiple components need access to the same DOM element
2. **Cross-Component Communication**: Components can communicate through custom events
3. **Lifecycle Management**: Track when elements are mounted/unmounted
4. **Size Monitoring**: Observe and react to size changes
5. **Plugin Integration**: Attach third-party libraries that need DOM elements

## Notes

- The event system is global - any component can access any container by ID
- Events are cleaned up automatically when components unmount
- The ref is updated synchronously when the element changes
- Safe to use with conditional rendering and dynamic content