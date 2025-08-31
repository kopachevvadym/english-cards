'use client'

import { useState, useEffect } from 'react'
import {
    Container,
    Typography,
    Box,
    Button,
    AppBar,
    Toolbar,
    Fab,
    LinearProgress,
    Alert,
    Chip,
    CircularProgress,
    Tooltip,
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
} from '@mui/icons-material'
import { FlashCard } from '@/components/FlashCard'
import { ImportDialog } from '@/components/ImportDialog'
import { AddWordDialog } from '@/components/AddWordDialog'
import { WordList } from '@/components/WordList'
import { GameStats } from '@/components/GameStats'
import { useCards } from '@/hooks/useCards'

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
    } = useCards()

    const [importDialogOpen, setImportDialogOpen] = useState(false)
    const [addWordDialogOpen, setAddWordDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // Early return with loading state if not mounted yet
    if (!mounted) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                }}
            >
                <CircularProgress />
            </Box>
        )
    }

    const activeCards = getActiveCards()
    const currentCard = activeCards[currentCardIndex]
    const unknownCards = cards.filter(card => !card.isKnown)
    const progress = cards.length > 0 ? ((cards.length - unknownCards.length) / cards.length) * 100 : 0

    const handleNext = () => {
        if (currentCardIndex < activeCards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1)
        } else {
            setCurrentCardIndex(0)
        }
    }

    const handlePrevious = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1)
        } else {
            setCurrentCardIndex(activeCards.length - 1)
        }
    }

    const handleMarkKnown = () => {
        if (currentCard) {
            markAsKnown(currentCard.id)
            if (activeCards.length > 1) {
                handleNext()
            } else {
                setCurrentCardIndex(0)
            }
        }
    }

    const handleMarkUnknown = () => {
        if (currentCard) {
            markAsUnknown(currentCard.id)
            handleNext()
        }
    }

    const handleAddSingleWord = (word: string, translation: string) => {
        const jsonData = { [word]: translation }
        importCards(jsonData)
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
                        {cards.length > 0 && (
                            <Box sx={{ 
                                display: 'flex', 
                                gap: { xs: 1, sm: 2 }, 
                                justifyContent: 'center', 
                                flexWrap: 'wrap', 
                                mb: 2,
                                '& .MuiButton-root': {
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    px: { xs: 1, sm: 2 }
                                }
                            }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<CloudDownloadIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
                                    onClick={exportProgress}
                                >
                                    <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Export Progress</Box>
                                    <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Export</Box>
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<CloudUploadIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
                                    onClick={handleImportProgress}
                                >
                                    <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Import Progress</Box>
                                    <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Import</Box>
                                </Button>
                            </Box>
                        )}
                        <WordList
                            cards={cards}
                            onMarkKnown={markAsKnown}
                            onMarkUnknown={markAsUnknown}
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
                                    <Button
                                        variant="outlined"
                                        startIcon={<UploadIcon />}
                                        onClick={() => setImportDialogOpen(true)}
                                    >
                                        Import JSON
                                    </Button>
                                    {cards.length > 0 && (
                                         <>
                                            <Button
                                                variant="outlined"
                                                startIcon={<CloudDownloadIcon />}
                                                onClick={exportProgress}
                                            >
                                                Export Progress
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<CloudUploadIcon />}
                                                onClick={handleImportProgress}
                                            >
                                                Import Progress
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<RefreshIcon />}
                                                onClick={resetProgress}
                                            >
                                                Reset Progress
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: { xs: 1, sm: 2 }, 
                                    mb: 2,
                                    justifyContent: 'center'
                                }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handlePrevious}
                                        disabled={activeCards.length <= 1}
                                        sx={{ 
                                            minWidth: { xs: 40, sm: 64 },
                                            px: { xs: 1, sm: 2 }
                                        }}
                                    >
                                        <PrevIcon sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }} />
                                    </Button>

                                    <Typography 
                                        variant="h6" 
                                        color="text.secondary"
                                        sx={{ 
                                            fontSize: { xs: '1rem', sm: '1.25rem' },
                                            minWidth: { xs: 60, sm: 80 },
                                            textAlign: 'center'
                                        }}
                                    >
                                        {currentCardIndex + 1} / {activeCards.length}
                                    </Typography>

                                    <Button
                                        variant="outlined"
                                        onClick={handleNext}
                                        disabled={activeCards.length <= 1}
                                        sx={{ 
                                            minWidth: { xs: 40, sm: 64 },
                                            px: { xs: 1, sm: 2 }
                                        }}
                                    >
                                        <NextIcon sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }} />
                                    </Button>
                                </Box>

                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: 'center', 
                                    gap: { xs: 1.5, sm: 2 }, 
                                    mb: 2, 
                                    justifyContent: 'center'
                                }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        alignItems: 'center', 
                                        gap: { xs: 0.5, sm: 1 },
                                        textAlign: 'center'
                                    }}>
                                        <Button
                                            variant={isShuffled ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={<ShuffleIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />}
                                            onClick={toggleShuffle}
                                            sx={{
                                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                                py: { xs: 0.25, sm: 0.5 },
                                                px: { xs: 1, sm: 1.5 },
                                                minWidth: { xs: 100, sm: 'auto' }
                                            }}
                                        >
                                            {isShuffled ? 'Shuffled' : 'Sequential'}
                                        </Button>
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary"
                                            sx={{ 
                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                display: { xs: 'block', sm: 'inline' }
                                            }}
                                        >
                                            {isShuffled ? '🔀 Random order' : '📋 Original order'}
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        alignItems: 'center', 
                                        gap: { xs: 0.5, sm: 1 },
                                        textAlign: 'center'
                                    }}>
                                        <Button
                                            variant={includeKnownWords ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={<SchoolIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />}
                                            onClick={toggleIncludeKnownWords}
                                            sx={{
                                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                                py: { xs: 0.25, sm: 0.5 },
                                                px: { xs: 1, sm: 1.5 },
                                                minWidth: { xs: 100, sm: 'auto' }
                                            }}
                                        >
                                            {includeKnownWords ? 'All Words' : 'Unknown Only'}
                                        </Button>
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary"
                                            sx={{ 
                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                display: { xs: 'block', sm: 'inline' }
                                            }}
                                        >
                                            {includeKnownWords ? '📚 Review all cards' : '🎯 Focus on learning'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <FlashCard
                                    card={currentCard}
                                    onMarkKnown={handleMarkKnown}
                                    onMarkUnknown={handleMarkUnknown}
                                />

                                <GameStats 
                                    cards={cards}
                                    activeCards={activeCards}
                                    includeKnownWords={includeKnownWords}
                                />
                            </>
                        )}
                    </Box>
                )}
            </Container>

            <Box sx={{ 
                position: 'fixed', 
                bottom: { xs: 12, sm: 16 }, 
                right: { xs: 12, sm: 16 }, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: { xs: 0.5, sm: 1 },
                zIndex: 1000
            }}>
                <Tooltip title="Add a new word" placement="left">
                    <Fab
                        color="primary"
                        aria-label="add word"
                        onClick={() => setAddWordDialogOpen(true)}

                        sx={{ 
                            width: { xs: 48, sm: 56 },
                            height: { xs: 48, sm: 56 }
                        }}
                    >
                        <CreateIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    </Fab>
                </Tooltip>
                <Tooltip title="Import words from JSON" placement="left">
                    <Fab
                        color="secondary"
                        aria-label="import"
                        size="small"
                        onClick={() => setImportDialogOpen(true)}
                        sx={{ 
                            width: { xs: 40, sm: 40 },
                            height: { xs: 40, sm: 40 }
                        }}
                    >
                        <UploadIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                    </Fab>
                </Tooltip>
                {cards.length > 0 && (
                    <>
                        <Tooltip title="Download your progress as a file" placement="left">
                            <Fab
                                color="info"
                                aria-label="export progress"
                                size="small"
                                onClick={exportProgress}
                                sx={{ 
                                    width: { xs: 40, sm: 40 },
                                    height: { xs: 40, sm: 40 }
                                }}
                            >
                                <CloudDownloadIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                            </Fab>
                        </Tooltip>
                        <Tooltip title="Upload and restore previous progress" placement="left">
                            <Fab
                                color="warning"
                                aria-label="import progress"
                                size="small"
                                onClick={handleImportProgress}
                                sx={{ 
                                    width: { xs: 40, sm: 40 },
                                    height: { xs: 40, sm: 40 }
                                }}
                            >
                                <CloudUploadIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                            </Fab>
                        </Tooltip>
                    </>
                )}
            </Box>

            <AddWordDialog
                open={addWordDialogOpen}
                onClose={() => setAddWordDialogOpen(false)}
                onAddWord={handleAddSingleWord}
            />

            <ImportDialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                onImport={importCards}
            />
        </>
    )
}