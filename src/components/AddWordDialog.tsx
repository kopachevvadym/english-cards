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

interface AddWordDialogProps {
  open: boolean
  onClose: () => void
  onAddWord: (word: string, translation: string) => void
}

export const AddWordDialog = ({ open, onClose, onAddWord }: AddWordDialogProps) => {
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!word.trim()) {
      setError('Please enter a word')
      return
    }
    if (!translation.trim()) {
      setError('Please enter a translation')
      return
    }

    onAddWord(word.trim(), translation.trim())
    setWord('')
    setTranslation('')
    setError('')
    onClose()
  }

  const handleClose = () => {
    setWord('')
    setTranslation('')
    setError('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && word.trim() && translation.trim()) {
      handleAdd()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Word</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add a single word-translation pair to your flashcards.
          </Typography>
          
          <TextField
            fullWidth
            label="Word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., hello"
            variant="outlined"
            sx={{ mb: 2, mt: 2 }}
            autoFocus
          />
          
          <TextField
            fullWidth
            label="Translation"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., hola"
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
              💡 Tip:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Press Enter to quickly add the word, or use the Import JSON option for multiple words at once.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleAdd} 
          variant="contained" 
          disabled={!word.trim() || !translation.trim()}
        >
          Add Word
        </Button>
      </DialogActions>
    </Dialog>
  )
}