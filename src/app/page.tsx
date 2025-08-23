'use client'

import { useState } from 'react'
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
} from '@mui/material'
import {
    Add as AddIcon,
    NavigateNext as NextIcon,
    NavigateBefore as PrevIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material'
import { FlashCard } from '@/components/FlashCard'
import { ImportDialog } from '@/components/ImportDialog'
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
    } = useCards()

    const [importDialogOpen, setImportDialogOpen] = useState(false)

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



    return (
        <>
            <AppBar position="static" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        English Cards
                    </Typography>
                    <Chip
                        label={`${cards.length - activeCards.length}/${cards.length} learned`}
                        color="secondary"
                        variant="outlined"
                        sx={{ color: 'white', borderColor: 'white' }}
                    />
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

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    {activeCards.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            {cards.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Welcome to Enki Cards!
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
                                    startIcon={<AddIcon />}
                                    onClick={() => setImportDialogOpen(true)}
                                >
                                    Import Cards
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

                            <FlashCard
                                card={currentCard}
                                onMarkKnown={handleMarkKnown}
                                onMarkUnknown={handleMarkUnknown}
                            />

                            <Box sx={{ textAlign: 'center', mt: 2, maxWidth: 400 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    💡 <strong>How to use:</strong>
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    1. Mark ✓ if you know the word, or click to see translation
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    2. Use ✗ to review words again later
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    3. Known words won't appear again
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </Container>

            <Fab
                color="primary"
                aria-label="import"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={() => setImportDialogOpen(true)}
            >
                <AddIcon />
            </Fab>

            <ImportDialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                onImport={importCards}
            />
        </>
    )
}