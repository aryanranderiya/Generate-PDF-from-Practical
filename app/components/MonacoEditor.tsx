'use client'

import { useRef, useEffect } from 'react'
import * as monaco from 'monaco-editor'

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
}

export default function MonacoEditor({ value, onChange, language = 'javascript' }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (editorRef.current) {
      editorInstanceRef.current = monaco.editor.create(editorRef.current, {
        value: value,
        language: language,
        theme: 'vs-dark',
        minimap: { enabled: false },
        automaticLayout: true,
      })

      editorInstanceRef.current.onDidChangeModelContent(() => {
        onChange(editorInstanceRef.current?.getValue() || '')
      })
    }

    return () => {
      editorInstanceRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (editorInstanceRef.current) {
      const currentValue = editorInstanceRef.current.getValue()
      if (currentValue !== value) {
        editorInstanceRef.current.setValue(value)
      }
    }
  }, [value])

  return <div ref={editorRef} style={{ width: '100%', height: '400px' }} />
}

