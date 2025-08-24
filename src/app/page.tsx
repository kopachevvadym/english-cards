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
    const progress = cards.length > 0 ? ((cards.length - activeCards.length) / cards.length) * 100 : 0

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



    return (
        <>
            <AppBar position="static" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        English Cards
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                            size="small"
                            startIcon={<ViewModuleIcon />}
                            onClick={() => setViewMode('cards')}
                            sx={{ 
                                color: viewMode === 'cards' ? 'inherit' : 'white',
                                borderColor: 'white',
                                '&:hover': { borderColor: 'white' }
                            }}
                        >
                            Cards
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'contained' : 'outlined'}
                            size="small"
                            startIcon={<ViewListIcon />}
                            onClick={() => setViewMode('list')}
                            sx={{ 
                                color: viewMode === 'list' ? 'inherit' : 'white',
                                borderColor: 'white',
                                '&:hover': { borderColor: 'white' }
                            }}
                        >
                            List
                        </Button>
                        <Chip
                            label={`${cards.length - activeCards.length}/${cards.length} learned`}
                            color="secondary"
                            variant="outlined"
                            sx={{ color: 'white', borderColor: 'white' }}
                        />
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ py: 4 }}>
                {cards.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
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
                        />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        {activeCards.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                {cards.length === 0 ? (
                                    <Alert severity="info" sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Welcome to English Cards!
                                        </Typography>
                                        <Typography>
                                            Start by importing some flashcards to begin learning.
                                        </Typography>
                                    </Alert>
                                ) : (
                                    <Alert severity="success" sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Congratulations! 🎉
                                        </Typography>
                                        <Typography>
                                            You've learned all your cards! You can reset your progress to review them again.
                                        </Typography>
                                    </Alert>
                                )}

                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                                        <Button
                                            variant="outlined"
                                            startIcon={<RefreshIcon />}
                                            onClick={resetProgress}
                                        >
                                            Reset Progress
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handlePrevious}
                                        disabled={activeCards.length <= 1}
                                    >
                                        <PrevIcon />
                                    </Button>

                                    <Typography variant="h6" color="text.secondary">
                                        {currentCardIndex + 1} / {activeCards.length}
                                    </Typography>

                                    <Button
                                        variant="outlined"
                                        onClick={handleNext}
                                        disabled={activeCards.length <= 1}
                                    >
                                        <NextIcon />
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Button
                                        variant={isShuffled ? 'contained' : 'outlined'}
                                        size="small"
                                        startIcon={<ShuffleIcon />}
                                        onClick={toggleShuffle}
                                        sx={{
                                            fontSize: '0.75rem',
                                            py: 0.5,
                                            px: 1.5,
                                        }}
                                    >
                                        {isShuffled ? 'Shuffled' : 'Sequential'}
                                    </Button>
                                    <Typography variant="caption" color="text.secondary">
                                        {isShuffled ? '🔀 Random order' : '📋 Original order'}
                                    </Typography>
                                </Box>

                                <FlashCard
                                    card={currentCard}
                                    onMarkKnown={handleMarkKnown}
                                    onMarkUnknown={handleMarkUnknown}
                                />

                                <GameStats 
                                    cards={cards}
                                    activeCards={activeCards}
                                />
                            </>
                        )}
                    </Box>
                )}
            </Container>

            <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Fab
                    color="primary"
                    aria-label="add word"
                    onClick={() => setAddWordDialogOpen(true)}
                >
                    <CreateIcon />
                </Fab>
                <Fab
                    color="secondary"
                    aria-label="import"
                    size="small"
                    onClick={() => setImportDialogOpen(true)}
                >
                    <UploadIcon />
                </Fab>
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