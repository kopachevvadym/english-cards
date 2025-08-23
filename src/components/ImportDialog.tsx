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
  onImport: (data: any[]) => void
}

export const ImportDialog = ({ open, onClose, onImport }: ImportDialogProps) => {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState('')

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonText)
      if (!Array.isArray(data)) {
        setError('JSON must be an array of objects')
        return
      }
      
      const isValid = data.every(item => 
        typeof item === 'object' && item !== null && Object.keys(item).length > 0
      )
      
      if (!isValid) {
        setError('Each item must be an object with word-translation pairs')
        return
      }

      onImport(data)
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

  const exampleJson = `[
  {
    "hello": "hola",
    "goodbye": "adiós",
    "thank you": "gracias"
  },
  {
    "cat": "gato",
    "dog": "perro"
  }
]`

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Cards from JSON</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Import flashcards by pasting JSON data. Use simple word-translation pairs.
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={10}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={exampleJson}
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
            Example format:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem' }}>
            {exampleJson}
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