'use client'

import { useState, useMemo } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
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
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  Check as CheckIcon,
  Undo as UndoIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import { Card } from '@/types/card'
import { EditWordDialog } from './EditWordDialog'

interface WordListProps {
  cards: Card[]
  onMarkKnown: (cardId: string) => void
  onMarkUnknown: (cardId: string) => void
  onDeleteCard: (cardId: string) => void
  onUpdateCard: (updatedCard: Card) => void
}

export const WordList = ({ cards, onMarkKnown, onMarkUnknown, onDeleteCard, onUpdateCard }: WordListProps) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
    cardId: string
  } | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const filteredCards = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return cards
    
    const term = debouncedSearchTerm.toLowerCase().trim()
    return cards.filter(card => 
      card.word.toLowerCase().includes(term) ||
      card.translation.toLowerCase().includes(term) ||
      (card.example && card.example.toLowerCase().includes(term)) ||
      (card.exampleTranslation && card.exampleTranslation.toLowerCase().includes(term))
    )
  }, [cards, debouncedSearchTerm])

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

  const handleEditCard = () => {
    if (contextMenu) {
      const card = cards.find(c => c.id === contextMenu.cardId)
      if (card) {
        setCardToEdit(card)
        setEditDialogOpen(true)
      }
      handleContextMenuClose()
    }
  }

  const handleUpdateCard = (updatedCard: Card) => {
    onUpdateCard(updatedCard)
    setEditDialogOpen(false)
    setCardToEdit(null)
  }

  const handleEditDialogClose = () => {
    setEditDialogOpen(false)
    setCardToEdit(null)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
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

      {/* Search Field */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search words, translations, or examples..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClearSearch}
                  edge="end"
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.paper',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              },
            },
          }}
        />
        {debouncedSearchTerm && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mt: 1, textAlign: 'center' }}
          >
            Showing {filteredCards.length} of {cards.length} words
          </Typography>
        )}
      </Box>
      
      <List sx={{ width: '100%' }}>
        {filteredCards.map((card, index) => (
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
                    
                    {card.example && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mt: 1,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          fontStyle: 'italic',
                          opacity: 0.8,
                          wordBreak: 'break-word'
                        }}
                      >
                        Example: "{card.example}"
                        {card.exampleTranslation && (
                          <span style={{ display: 'block', marginTop: '0.25rem' }}>
                            → "{card.exampleTranslation}"
                          </span>
                        )}
                      </Typography>
                    )}
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
            {index < filteredCards.length - 1 && <Divider variant="middle" />}
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

      {cards.length > 0 && filteredCards.length === 0 && (
        <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 8 } }}>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            No words found
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 1,
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            Try adjusting your search term
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
        <MenuItem onClick={handleEditCard}>
          <ListItemIcon>
            <EditIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Edit Word" 
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>
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

      {/* Edit Word Dialog */}
      <EditWordDialog
        open={editDialogOpen}
        card={cardToEdit}
        onClose={handleEditDialogClose}
        onUpdateWord={handleUpdateCard}
      />
    </Box>
  )
}