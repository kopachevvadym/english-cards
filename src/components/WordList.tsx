'use client'

import { useState } from 'react'
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Check as CheckIcon,
  Undo as UndoIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { Card } from '@/types/card'

interface WordListProps {
  cards: Card[]
  onMarkKnown: (cardId: string) => void
  onMarkUnknown: (cardId: string) => void
  onDeleteCard: (cardId: string) => void
}

export const WordList = ({ cards, onMarkKnown, onMarkUnknown, onDeleteCard }: WordListProps) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
    cardId: string
  } | null>(null)

  const handleToggleKnown = (card: Card) => {
    if (card.isKnown) {
      onMarkUnknown(card.id)
    } else {
      onMarkKnown(card.id)
    }
  }

  const handleContextMenu = (event: React.MouseEvent, cardId: string) => {
    event.preventDefault()
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            cardId,
          }
        : null
    )
  }

  const handleContextMenuClose = () => {
    setContextMenu(null)
  }

  const handleDeleteCard = () => {
    if (contextMenu) {
      onDeleteCard(contextMenu.cardId)
      handleContextMenuClose()
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 800, px: { xs: 1, sm: 0 } }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          mb: { xs: 2, sm: 3 }, 
          textAlign: 'center',
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}
      >
        All Words ({cards.length})
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {cards.map((card, index) => (
          <Box key={card.id}>
            <ListItem
              sx={{
                py: { xs: 1, sm: 2 },
                px: { xs: 1, sm: 3 },
                '&:hover .word-controls': {
                  opacity: { xs: 1, sm: 1 },
                },
              }}
            >
              <Paper
                elevation={1}
                onContextMenu={(e) => handleContextMenu(e, card.id)}
                sx={{
                  width: '100%',
                  p: { xs: 2, sm: 3 },
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                  bgcolor: card.isKnown ? 'success.50' : 'background.paper',
                  border: card.isKnown ? '1px solid' : 'none',
                  borderColor: card.isKnown ? 'success.200' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  gap: { xs: 2, sm: 0 },
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-2px)' },
                    boxShadow: { xs: 1, sm: 3 },
                  },
                }}
              >
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' }, 
                  gap: { xs: 1, sm: 3 }
                }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      sx={{ 
                        fontWeight: 600,
                        color: card.isKnown ? 'success.700' : 'text.primary',
                        textDecoration: card.isKnown ? 'line-through' : 'none',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        wordBreak: 'break-word'
                      }}
                    >
                      {card.word}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ 
                        mt: 0.5,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        wordBreak: 'break-word'
                      }}
                    >
                      {card.translation}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: { xs: 'space-between', sm: 'flex-end' },
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 }
                  }}>
                    <Chip
                      label={card.isKnown ? 'Known' : 'Learning'}
                      color={card.isKnown ? 'success' : 'default'}
                      variant={card.isKnown ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        height: { xs: 24, sm: 32 }
                      }}
                    />

                    <Box 
                      className="word-controls"
                      sx={{ 
                        display: 'flex', 
                        gap: 1,
                        opacity: { xs: 1, sm: 0 },
                        transition: 'opacity 0.2s ease-in-out',
                      }}
                    >
                      {card.isKnown ? (
                        <Tooltip title="Mark as unknown" arrow>
                          <IconButton
                            onClick={() => handleToggleKnown(card)}
                            sx={{
                              color: 'warning.main',
                              width: { xs: 36, sm: 40 },
                              height: { xs: 36, sm: 40 },
                              '&:hover': { 
                                bgcolor: 'warning.50',
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <UndoIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Mark as known" arrow>
                          <IconButton
                            onClick={() => onMarkKnown(card.id)}
                            sx={{
                              color: 'success.main',
                              width: { xs: 36, sm: 40 },
                              height: { xs: 36, sm: 40 },
                              '&:hover': { 
                                bgcolor: 'success.50',
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <CheckIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </ListItem>
            {index < cards.length - 1 && <Divider variant="middle" />}
          </Box>
        ))}
      </List>
      
      {cards.length === 0 && (
        <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 8 } }}>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            No words yet
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 1,
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            Import some cards to get started!
          </Typography>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        slotProps={{
          paper: {
            sx: {
              minWidth: 120,
              boxShadow: 3,
              borderRadius: 1,
            }
          }
        }}
      >
        <MenuItem onClick={handleDeleteCard} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon sx={{ color: 'error.main', fontSize: '1.2rem' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Delete Word" 
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>
      </Menu>
    </Box>
  )
}