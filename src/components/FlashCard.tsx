'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
} from '@mui/material'
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { Card as CardType } from '@/types/card'

interface FlashCardProps {
  card: CardType
  onMarkKnown: () => void
  onMarkUnknown: () => void
}

export const FlashCard = ({ card, onMarkKnown, onMarkUnknown }: FlashCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleCardClick = () => {
    setIsFlipped(!isFlipped)
  }

  const handleReset = () => {
    setIsFlipped(false)
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 400, height: 300 }}>
      <Card
        onClick={handleCardClick}
        sx={{
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          position: 'relative',
          '&:hover': {
            transform: 'scale(1.02)',
          },
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        {!isFlipped ? (
          /* Front Side */
          <CardContent
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h4" component="div" gutterBottom>
              {card.word}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 2 }}>
              Click to reveal translation
            </Typography>
          </CardContent>
        ) : (
          /* Back Side */
          <CardContent
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h4" component="div" gutterBottom>
              {card.translation}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, mb: 3 }}>
              Original: {card.word}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkKnown()
                }}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
                title="Mark as known"
              >
                <CheckIcon />
              </IconButton>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkUnknown()
                }}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
                title="Review again"
              >
                <CloseIcon />
              </IconButton>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  handleReset()
                }}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
                title="Flip back"
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  )
}