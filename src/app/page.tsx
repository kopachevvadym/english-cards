'use client'

import { useState, useEffect } from 'react'
import {
    Container,
    Typography,
    Box,
    Button,
    AppBar,
    Toolbar,
    LinearProgress,
    Alert,
    Chip,
    Menu,
    MenuItem,
    IconButton,
    Divider,
} from '@mui/material'
import {
    NavigateNext as NextIcon,
    NavigateBefore as PrevIcon,
    Refresh as RefreshIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Upload as UploadIcon,
    Create as CreateIcon,
    Shuffle as ShuffleIcon,
    CloudDownload as CloudDownloadIcon,
    CloudUpload as CloudUploadIcon,
    School as SchoolIcon,
    Settings as SettingsIcon,
    Add as AddIcon,
    Translate as TranslateIcon,
} from '@mui/icons-material'
import { FlashCard } from '@/components/FlashCard'
import { ImportDialog } from '@/components/ImportDialog'
import { AddWordDialog } from '@/components/AddWordDialog'
import { EditWordDialog } from '@/components/EditWordDialog'
import { WordList } from '@/components/WordList'
import { GameStats } from '@/components/GameStats'
import { SettingsDialog } from '@/components/SettingsDialog'
import { useCards } from '@/hooks/useCards'
import { useSettings } from '@/contexts/SettingsContext'
import { Card, Example } from '@/types/card'

export default function Home() {
    const {
        cards,
        currentCardIndex,
        setCurrentCardIndex,
        importCards,
        markAsKnown,
        markAsUnknown,
        getActiveCards,
        resetProgress,
        isShuffled,
        toggleShuffle,
        includeKnownWords,
        toggleIncludeKnownWords,
        exportProgress,
        importProgress,
        deleteCard,
        updateCard,
        navigateToNext,
        navigateToPrevious,
    } = useCards()

    const { showTranslationFirst, setShowTranslationFirst } = useSettings()

    const [importDialogOpen, setImportDialogOpen] = useState(false)
    const [addWordDialogOpen, setAddWordDialogOpen] = useState(false)
    const [editWordDialogOpen, setEditWordDialogOpen] = useState(false)
    const [editingCard, setEditingCard] = useState<Card | null>(null)
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
    const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null)
    const settingsOpen = Boolean(settingsAnchorEl)

    const activeCards = getActiveCards()
    const currentCard = activeCards[currentCardIndex]
    const unknownCards = cards.filter(card => !card.isKnown)
    const progress = cards.length > 0 ? ((cards.length - unknownCards.length) / cards.length) * 100 : 0

    const handleNext = () => {
        navigateToNext()
    }

    const handlePrevious = () => {
        navigateToPrevious()
    }

    const handleMarkKnown = async () => {
        if (currentCard) {
            await markAsKnown(currentCard.id)
            // Navigate to next card after marking
            navigateToNext()
        }
    }

    const handleMarkUnknown = async () => {
        if (currentCard) {
            await markAsUnknown(currentCard.id)
            // Navigate to next card after marking
            navigateToNext()
        }
    }

    const handleAddSingleWord = (word: string, translation: string, examples: Example[]) => {
        const cardData = [{
            word,
            translation,
            examples
        }]
        importCards(cardData)
    }

    const handleImportProgress = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                try {
                    await importProgress(file)
                    // Show success feedback
                } catch (error) {
                    console.error('Failed to import progress:', error)
                    // Show error feedback
                }
            }
        }
        input.click()
        setSettingsAnchorEl(null)
    }

    const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
        setSettingsAnchorEl(event.currentTarget)
    }

    const handleSettingsClose = () => {
        setSettingsAnchorEl(null)
    }

    const handleExportProgress = () => {
        exportProgress()
        setSettingsAnchorEl(null)
    }

    const handleResetProgress = () => {
        resetProgress()
        setSettingsAnchorEl(null)
    }

    const handleAddWordFromSettings = () => {
        setAddWordDialogOpen(true)
        setSettingsAnchorEl(null)
    }

    const handleImportWordsFromSettings = () => {
        setImportDialogOpen(true)
        setSettingsAnchorEl(null)
    }

    const handleEditCard = () => {
        if (currentCard) {
            setEditingCard(currentCard)
            setEditWordDialogOpen(true)
        }
    }

    const handleDeleteCard = async () => {
        if (currentCard) {
            await deleteCard(currentCard.id)
            // Navigate to next card after deletion, or previous if it was the last card
            if (currentCardIndex >= activeCards.length - 1 && currentCardIndex > 0) {
                setCurrentCardIndex(currentCardIndex - 1)
            }
        }
    }

    const handleUpdateCard = async (updatedCard: Card) => {
        await updateCard(updatedCard)
        setEditWordDialogOpen(false)
        setEditingCard(null)
    }



    return (
        <>
            <AppBar position="static" elevation={0}>
                <Toolbar sx={{ px: { xs: 1, sm: 3 } }}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        English Cards
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 1, sm: 2 },
                        flexWrap: 'wrap'
                    }}>
                        <Button
                            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                            size="small"
                            startIcon={<ViewModuleIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />}
                            onClick={() => setViewMode('cards')}
                            sx={{
                                color: viewMode === 'cards' ? 'inherit' : 'white',
                                borderColor: 'white',
                                '&:hover': { borderColor: 'white' },
                                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                px: { xs: 1, sm: 2 },
                                minWidth: { xs: 'auto', sm: 'auto' }
                            }}
                        >
                            <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Cards</Box>
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'contained' : 'outlined'}
                            size="small"
                            startIcon={<ViewListIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />}
                            onClick={() => setViewMode('list')}
                            sx={{
                                color: viewMode === 'list' ? 'inherit' : 'white',
                                borderColor: 'white',
                                '&:hover': { borderColor: 'white' },
                                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                px: { xs: 1, sm: 2 },
                                minWidth: { xs: 'auto', sm: 'auto' }
                            }}
                        >
                            <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>List</Box>
                        </Button>
                        <Chip
                            label={`${cards.length - unknownCards.length}/${cards.length}`}
                            color="secondary"
                            variant="outlined"
                            sx={{
                                color: 'white',
                                borderColor: 'white',
                                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                height: { xs: 24, sm: 32 }
                            }}
                        />
                      <IconButton
                            onClick={handleSettingsClick}
                            sx={{
                                color: 'white',
                                ml: 1
                            }}
                        >
                            <SettingsIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
                {cards.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: { xs: 6, sm: 8 },
                                borderRadius: 4
                            }}
                        />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 1,
                                textAlign: 'center',
                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                            }}
                        >
                            Progress: {Math.round(progress)}%
                        </Typography>
                    </Box>
                )}

                {viewMode === 'list' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%' }}>

                        <WordList
                            cards={cards}
                            onMarkKnown={markAsKnown}
                            onMarkUnknown={markAsUnknown}
                            onDeleteCard={deleteCard}
                            onUpdateCard={updateCard}
                        />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        {activeCards.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 8 }, px: { xs: 1, sm: 2 } }}>
                                {cards.length === 0 ? (
                                    <Alert severity="info" sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Welcome to English Cards!
                                        </Typography>
                                        <Typography>
                                            Start by importing some flashcards to begin learning.
                                        </Typography>
                                    </Alert>
                                ) : !includeKnownWords ? (
                                    <Alert severity="success" sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Congratulations! 🎉
                                        </Typography>
                                        <Typography>
                                            You've learned all your cards! You can reset your progress to review them again, or toggle "All Words" to practice known words.
                                        </Typography>
                                    </Alert>
                                ) : (
                                    <Alert severity="info" sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            No cards available
                                        </Typography>
                                        <Typography>
                                            Add some cards to start training.
                                        </Typography>
                                    </Alert>
                                )}

                                <Box sx={{
                                    display: 'flex',
                                    gap: { xs: 1, sm: 2 },
                                    justifyContent: 'center',
                                    flexWrap: 'wrap',
                                    '& .MuiButton-root': {
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        px: { xs: 1.5, sm: 2 },
                                        py: { xs: 0.5, sm: 1 }
                                    }
                                }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<CreateIcon />}
                                        onClick={() => setAddWordDialogOpen(true)}
                                    >
                                        Add Word
                                    </Button>


                                </Box>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: { xs: 1, sm: 1.5 },
                                    mb: 1.5,
                                    justifyContent: 'center'
                                }}>
                                    <Button
                                        variant="contained"
                                        onClick={handlePrevious}
                                        disabled={activeCards.length <= 1}
                                        sx={{
                                            minWidth: { xs: 36, sm: 44 },
                                            height: { xs: 36, sm: 44 },
                                            borderRadius: '50%',
                                            p: 0,
                                            bgcolor: 'primary.main',
                                            '&:disabled': {
                                                bgcolor: 'grey.300',
                                                color: 'grey.500'
                                            },
                                            boxShadow: 1,
                                            '&:hover:not(:disabled)': {
                                                bgcolor: 'primary.dark',
                                                boxShadow: 2
                                            }
                                        }}
                                    >
                                        <PrevIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }} />
                                    </Button>

                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: { xs: 60, sm: 80 }
                                    }}>
                                        <Typography
                                            variant="h6"
                                            color="primary.main"
                                            sx={{
                                                fontSize: { xs: '1rem', sm: '1.1rem' },
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                lineHeight: 1
                                            }}
                                        >
                                            {currentCardIndex + 1}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                                textAlign: 'center',
                                                lineHeight: 1
                                            }}
                                        >
                                            of {activeCards.length}
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        disabled={activeCards.length <= 1}
                                        sx={{
                                            minWidth: { xs: 36, sm: 44 },
                                            height: { xs: 36, sm: 44 },
                                            borderRadius: '50%',
                                            p: 0,
                                            bgcolor: 'primary.main',
                                            '&:disabled': {
                                                bgcolor: 'grey.300',
                                                color: 'grey.500'
                                            },
                                            boxShadow: 1,
                                            '&:hover:not(:disabled)': {
                                                bgcolor: 'primary.dark',
                                                boxShadow: 2
                                            }
                                        }}
                                    >
                                        <NextIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }} />
                                    </Button>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: { xs: 0.75, sm: 1 },
                                    mb: 2,
                                    justifyContent: 'center',
                                    flexWrap: 'wrap'
                                }}>
                                    <Button
                                        variant={isShuffled ? 'contained' : 'outlined'}
                                        size="small"
                                        startIcon={<ShuffleIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                                        onClick={toggleShuffle}
                                        sx={{
                                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                            py: { xs: 0.5, sm: 0.75 },
                                            px: { xs: 1, sm: 1.5 },
                                            minWidth: { xs: 90, sm: 110 },
                                            height: { xs: 28, sm: 32 },
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            boxShadow: isShuffled ? 1 : 0
                                        }}
                                    >
                                        {isShuffled ? 'Shuffled' : 'Sequential'}
                                    </Button>

                                    <Button
                                        variant={includeKnownWords ? 'contained' : 'outlined'}
                                        size="small"
                                        startIcon={<SchoolIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                                        onClick={toggleIncludeKnownWords}
                                        sx={{
                                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                            py: { xs: 0.5, sm: 0.75 },
                                            px: { xs: 1, sm: 1.5 },
                                            minWidth: { xs: 90, sm: 110 },
                                            height: { xs: 28, sm: 32 },
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            boxShadow: includeKnownWords ? 1 : 0
                                        }}
                                    >
                                        {includeKnownWords ? 'All Words' : 'Unknown Only'}
                                    </Button>

                                    <Button
                                        variant={showTranslationFirst ? 'contained' : 'outlined'}
                                        size="small"
                                        startIcon={<TranslateIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                                        onClick={() => setShowTranslationFirst(!showTranslationFirst)}
                                        sx={{
                                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                            py: { xs: 0.5, sm: 0.75 },
                                            px: { xs: 1, sm: 1.5 },
                                            minWidth: { xs: 90, sm: 110 },
                                            height: { xs: 28, sm: 32 },
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            boxShadow: showTranslationFirst ? 1 : 0
                                        }}
                                    >
                                        {showTranslationFirst ? 'Translation First' : 'Word First'}
                                    </Button>
                                </Box>

                                <FlashCard
                                    card={currentCard}
                                    onMarkKnown={handleMarkKnown}
                                    onMarkUnknown={handleMarkUnknown}
                                    onEdit={handleEditCard}
                                    onDelete={handleDeleteCard}
                                    showTranslationFirst={showTranslationFirst}
                                />

                                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    <GameStats
                                        cards={cards}
                                        activeCards={activeCards}
                                        includeKnownWords={includeKnownWords}
                                    />
                                </Box>
                            </>
                        )}
                    </Box>
                )}
            </Container>

            <AddWordDialog
                open={addWordDialogOpen}
                onClose={() => setAddWordDialogOpen(false)}
                onAddWord={handleAddSingleWord}
            />

            <EditWordDialog
                open={editWordDialogOpen}
                card={editingCard}
                onClose={() => {
                    setEditWordDialogOpen(false)
                    setEditingCard(null)
                }}
                onUpdateWord={handleUpdateCard}
            />

            <ImportDialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                onImport={importCards}
            />

            <SettingsDialog
                open={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
            />

            {/* Settings Menu */}
            <Menu
                anchorEl={settingsAnchorEl}
                open={settingsOpen}
                onClose={handleSettingsClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            minWidth: 200,
                            boxShadow: 3,
                            borderRadius: 2
                        }
                    }
                }}
            >
                <MenuItem onClick={handleAddWordFromSettings}>
                    <AddIcon sx={{ mr: 2, color: 'primary.main' }} />
                    Add Word
                </MenuItem>
                <MenuItem onClick={handleImportWordsFromSettings}>
                    <UploadIcon sx={{ mr: 2, color: 'secondary.main' }} />
                    Import Words
                </MenuItem>
                <Divider />
                {cards.length > 0 && [
                    <Divider key="divider1" />,
                    <MenuItem key="export" onClick={handleExportProgress}>
                        <CloudDownloadIcon sx={{ mr: 2, color: 'info.main' }} />
                        Export Progress
                    </MenuItem>,
                    <MenuItem key="import" onClick={handleImportProgress}>
                        <CloudUploadIcon sx={{ mr: 2, color: 'warning.main' }} />
                        Import Progress
                    </MenuItem>,
                    <Divider key="divider2" />,
                    <MenuItem key="reset" onClick={handleResetProgress} sx={{ color: 'error.main' }}>
                        <RefreshIcon sx={{ mr: 2 }} />
                        Reset Progress
                    </MenuItem>
                ]}
            </Menu>
        </>
    )
}