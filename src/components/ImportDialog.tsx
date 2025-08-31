'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
} from '@mui/material'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImport: (data: Record<string, string> | Array<{word: string, translation: string, example?: string, exampleTranslation?: string}>) => void
}

export const ImportDialog = ({ open, onClose, onImport }: ImportDialogProps) => {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState('')

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonText)
      
      // Support both formats: simple object and array of card objects
      if (Array.isArray(data)) {
        // Array format with full card objects
        const isValid = data.every(item => 
          typeof item === 'object' && 
          item !== null &&
          typeof item.word === 'string' && 
          typeof item.translation === 'string' &&
          (item.example === undefined || typeof item.example === 'string') &&
          (item.exampleTranslation === undefined || typeof item.exampleTranslation === 'string')
        )
        
        if (!isValid) {
          setError('Array items must have "word" and "translation" strings, with optional "example" and "exampleTranslation" strings')
          return
        }
        
        onImport(data)
      } else if (typeof data === 'object' && data !== null) {
        // Simple object format (backward compatibility)
        const isValid = Object.entries(data).every(([key, value]) =>
          typeof key === 'string' && typeof value === 'string'
        )
        
        if (!isValid) {
          setError('All keys and values must be strings (word-translation pairs)')
          return
        }
        
        onImport(data)
      } else {
        setError('JSON must be an object with word-translation pairs or an array of card objects')
        return
      }

      setJsonText('')
      setError('')
      onClose()
    } catch (err) {
      setError('Invalid JSON format')
    }
  }

  const handleClose = () => {
    setJsonText('')
    setError('')
    onClose()
  }

  const exampleSimpleJson = `{
  "hello": "hola",
  "goodbye": "adiós",
  "thank you": "gracias"
}`

  const exampleAdvancedJson = `[
  {
    "word": "hello",
    "translation": "hola",
    "example": "Hello, how are you?",
    "exampleTranslation": "Hola, ¿cómo estás?"
  },
  {
    "word": "goodbye",
    "translation": "adiós",
    "example": "Goodbye, see you later!",
    "exampleTranslation": "¡Adiós, nos vemos luego!"
  }
]`

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Cards from JSON</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Import flashcards by pasting JSON data. Supports both simple word-translation pairs and advanced format with examples.
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={12}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={exampleAdvancedJson}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Simple format (word-translation pairs):
          </Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', mb: 2 }}>
            {exampleSimpleJson}
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            Advanced format (with examples):
          </Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
            {exampleAdvancedJson}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleImport} variant="contained" disabled={!jsonText.trim()}>
          Import
        </Button>
      </DialogActions>
    </Dialog>
  )
}