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
} from '@mui/icons-material'
import { Card as CardType } from '@/types/card'

interface FlashCardProps {
  card: CardType
  onMarkKnown: () => void
  onMarkUnknown: () => void
  showTranslationFirst?: boolean
}

export const FlashCard = ({ card, onMarkKnown, onMarkUnknown, showTranslationFirst = false }: FlashCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleCardClick = () => {
    setIsFlipped(!isFlipped)
  }

  const handleReset = () => {
    setIsFlipped(false)
  }

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: { xs: '100%', sm: 400 }, 
      height: { xs: 350, sm: 450 },
      mx: 'auto'
    }}>
      <Card
        onClick={handleCardClick}
        sx={{
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          position: 'relative',
          '&:hover': {
            transform: { xs: 'none', sm: 'scale(1.02)' },
          },
          '&:active': {
            transform: { xs: 'scale(0.98)', sm: 'scale(1.02)' },
          },
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        {!isFlipped ? (
          /* Front Side - shows word or translation based on setting */
          <CardContent
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              background: showTranslationFirst 
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              p: { xs: 2, sm: 3 }
            }}
          >
            <Typography 
              variant="h4" 
              component="div" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.8rem', sm: '2.125rem' },
                wordBreak: 'break-word',
                hyphens: 'auto'
              }}
            >
              {showTranslationFirst ? card.translation : card.word}
            </Typography>
            
            {(showTranslationFirst ? card.exampleTranslation : card.example) && (
              <Typography 
                variant="body1" 
                sx={{ 
                  opacity: 0.9, 
                  mt: { xs: 1, sm: 2 }, 
                  mb: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontStyle: 'italic',
                  textAlign: 'center',
                  px: 2
                }}
              >
                "{showTranslationFirst ? card.exampleTranslation : card.example}"
              </Typography>
            )}
            
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.8, 
                mt: { xs: 1, sm: 2 }, 
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              👆 Tap to reveal {showTranslationFirst ? 'original word' : 'translation'}
            </Typography>
            
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.7, 
                mb: { xs: 1, sm: 2 }, 
                textAlign: 'center',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}
            >
              Know this word already?
            </Typography>
            
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 1 } }}>
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
                    '&:active': { bgcolor: 'rgba(76,175,80,0.4)' },
                    width: { xs: 48, sm: 40 },
                    height: { xs: 48, sm: 40 }
                  }}
                >
                  <CheckIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.25rem' } }} />
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
                    '&:active': { bgcolor: 'rgba(244,67,54,0.4)' },
                    width: { xs: 48, sm: 40 },
                    height: { xs: 48, sm: 40 }
                  }}
                >
                  <CloseIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.25rem' } }} />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        ) : (
          /* Back Side - shows translation or word based on setting */
          <CardContent
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              background: showTranslationFirst 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              p: { xs: 2, sm: 3 }
            }}
          >
            <Typography 
              variant="h4" 
              component="div" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.8rem', sm: '2.125rem' },
                wordBreak: 'break-word',
                hyphens: 'auto'
              }}
            >
              {showTranslationFirst ? card.word : card.translation}
            </Typography>
            
            {(showTranslationFirst ? card.example : card.exampleTranslation) && (
              <Typography 
                variant="body1" 
                sx={{ 
                  opacity: 0.9, 
                  mt: { xs: 1, sm: 2 }, 
                  mb: { xs: 1, sm: 1 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontStyle: 'italic',
                  textAlign: 'center',
                  px: 2
                }}
              >
                "{showTranslationFirst ? card.example : card.exampleTranslation}"
              </Typography>
            )}
            
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.8, 
                mt: { xs: 0.5, sm: 1 }, 
                mb: { xs: 2, sm: 2 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              {showTranslationFirst ? 'Translation' : 'Original'}: {showTranslationFirst ? card.translation : card.word}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 1 } }}>
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
                    '&:active': { bgcolor: 'rgba(76,175,80,0.4)' },
                    width: { xs: 48, sm: 40 },
                    height: { xs: 48, sm: 40 }
                  }}
                >
                  <CheckIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.25rem' } }} />
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
                    '&:active': { bgcolor: 'rgba(244,67,54,0.4)' },
                    width: { xs: 48, sm: 40 },
                    height: { xs: 48, sm: 40 }
                  }}
                >
                  <CloseIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.25rem' } }} />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  )
}