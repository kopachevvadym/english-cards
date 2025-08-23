'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
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
    <Box sx={{ width: '100%', maxWidth: 400, height: 450 }}>
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
              position: 'relative',
            }}
          >
            <Typography variant="h4" component="div" gutterBottom>
              {card.word}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 2, mb: 3 }}>
              👆 Click to reveal translation
            </Typography>
            
            <Typography variant="caption" sx={{ opacity: 0.7, mb: 2, textAlign: 'center' }}>
              Know this word already?
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="I know this word! ✓" arrow placement="top">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkKnown()
                    handleReset()
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(76,175,80,0.3)' },
                  }}
                >
                  <CheckIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Need to review this again" arrow placement="top">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkUnknown()
                    handleReset()
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(244,67,54,0.3)' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
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
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, mb: 2 }}>
              Original: {card.word}
            </Typography>
            
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="I know this word! ✓" arrow placement="top">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkKnown()
                    handleReset()
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(76,175,80,0.3)' },
                  }}
                >
                  <CheckIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Need to review this again" arrow placement="top">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkUnknown()
                    handleReset()
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(244,67,54,0.3)' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  )
}