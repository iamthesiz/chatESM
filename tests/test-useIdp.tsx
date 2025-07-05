// @ts-nocheck
import React, { useState } from 'react'
import { useIdp } from '../hooks/useIdp'

function TestComponent({ initialId, unique }: { initialId?: string; unique?: string }) {
  const [contextId, typeId] = useIdp(initialId, unique)
  return (
    <div>
      <p>initialId: {initialId || 'undefined'}</p>
      <p>unique: {unique || 'undefined'}</p>
      <p>contextId: {contextId}</p>
      <p>typeId: {typeId}</p>
    </div>
  )
}

export default function TestPage() {
  const [key, setKey] = useState(0)
  const [props, setProps] = useState({ initialId: 'test-1', unique: 'component' })

  return (
    <div style={{ padding: 20 }}>
      <h1>useIdp Test</h1>

      <button onClick={() => setKey(k => k + 1)}>
        Force Remount (key: {key})
      </button>

      <button onClick={() => setProps({ initialId: 'test-2', unique: 'component' })}>
        Change to test-2
      </button>

      <button onClick={() => setProps({ initialId: 'test-1', unique: 'different' })}>
        Change unique to 'different'
      </button>

      <button onClick={() => setProps({ initialId: undefined, unique: 'component' })}>
        Remove initialId
      </button>

      <TestComponent key={key} {...props} />
    </div>
  )
}
