'use client'

import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  Divider,
} from '@mui/material'
import {
  Check as CheckIcon,
  Undo as UndoIcon,
} from '@mui/icons-material'
import { Card } from '@/types/card'

interface WordListProps {
  cards: Card[]
  onMarkKnown: (cardId: string) => void
  onMarkUnknown: (cardId: string) => void
}

export const WordList = ({ cards, onMarkKnown, onMarkUnknown }: WordListProps) => {
  const handleToggleKnown = (card: Card) => {
    if (card.isKnown) {
      onMarkUnknown(card.id)
    } else {
      onMarkKnown(card.id)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        All Words ({cards.length})
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {cards.map((card, index) => (
          <Box key={card.id}>
            <ListItem
              sx={{
                py: 2,
                px: 3,
                '&:hover .word-controls': {
                  opacity: 1,
                },
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  width: '100%',
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: card.isKnown ? 'success.50' : 'background.paper',
                  border: card.isKnown ? '1px solid' : 'none',
                  borderColor: card.isKnown ? 'success.200' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      sx={{ 
                        fontWeight: 600,
                        color: card.isKnown ? 'success.700' : 'text.primary',
                        textDecoration: card.isKnown ? 'line-through' : 'none',
                      }}
                    >
                      {card.word}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {card.translation}
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={card.isKnown ? 'Known' : 'Learning'}
                    color={card.isKnown ? 'success' : 'default'}
                    variant={card.isKnown ? 'filled' : 'outlined'}
                    size="small"
                  />
                </Box>

                <Box 
                  className="word-controls"
                  sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    ml: 2,
                    opacity: 0,
                    transition: 'opacity 0.2s ease-in-out',
                  }}
                >
                  {card.isKnown ? (
                    <Tooltip title="Mark as unknown" arrow>
                      <IconButton
                        onClick={() => handleToggleKnown(card)}
                        sx={{
                          color: 'warning.main',
                          '&:hover': { 
                            bgcolor: 'warning.50',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <UndoIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Mark as known" arrow>
                      <IconButton
                        onClick={() => onMarkKnown(card.id)}
                        sx={{
                          color: 'success.main',
                          '&:hover': { 
                            bgcolor: 'success.50',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <CheckIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Paper>
            </ListItem>
            {index < cards.length - 1 && <Divider variant="middle" />}
          </Box>
        ))}
      </List>
      
      {cards.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No words yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Import some cards to get started!
          </Typography>
        </Box>
      )}
    </Box>
  )
}