'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/types/card'

// Constants
const CARDS_STORAGE_KEY = 'english-cards'

export const useCards = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState(false)
  const [includeKnownWords, setIncludeKnownWords] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const savedCards = localStorage.getItem(CARDS_STORAGE_KEY)
    if (savedCards) {
      try {
        const parsedCards = JSON.parse(savedCards).map((card: any) => ({
          ...card,
          createdAt: new Date(card.createdAt),
          lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
        }))
        setCards(parsedCards)
      } catch (error) {
        console.error('Failed to parse saved cards:', error)
        // Clear corrupted data
        localStorage.removeItem(CARDS_STORAGE_KEY)
      }
    }
  }, [])

  const saveCards = (newCards: Card[]) => {
    setCards(newCards)
    if (mounted) {
      try {
        localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(newCards))
      } catch (error) {
        console.error('Failed to save cards to localStorage:', error)
      }
    }
  }

  const importCards = (jsonData: Record<string, string>) => {
    const newCards: Card[] = Object.entries(jsonData).map(([word, translation], index) => ({
      id: `${Date.now()}-${index}`,
      word: word,
      translation: translation,
      isKnown: false,
      createdAt: new Date(),
    }))

    const updatedCards = [...cards, ...newCards]
    saveCards(updatedCards)
  }

  const markAsKnown = (cardId: string) => {
    const updatedCards = cards.map(card =>
      card.id === cardId
        ? { ...card, isKnown: true, lastReviewed: new Date() }
        : card
    )
    saveCards(updatedCards)
  }

  const markAsUnknown = (cardId: string) => {
    const updatedCards = cards.map(card =>
      card.id === cardId
        ? { ...card, isKnown: false, lastReviewed: new Date() }
        : card
    )
    saveCards(updatedCards)
  }

  const shuffleArray = (array: Card[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const getActiveCards = () => {
    const activeCards = includeKnownWords 
      ? cards 
      : cards.filter(card => !card.isKnown)
    return isShuffled ? shuffleArray(activeCards) : activeCards
  }

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled)
    setCurrentCardIndex(0) // Reset to first card when toggling shuffle
  }

  const toggleIncludeKnownWords = () => {
    setIncludeKnownWords(!includeKnownWords)
    setCurrentCardIndex(0) // Reset to first card when toggling mode
  }

  const resetProgress = () => {
    const resetCards = cards.map(card => ({ ...card, isKnown: false }))
    saveCards(resetCards)
    setCurrentCardIndex(0)
  }

  const exportProgress = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalCards: cards.length,
      knownCards: cards.filter(card => card.isKnown).length,
      cards: cards
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `english-cards-progress-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importProgress = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string
          const importData = JSON.parse(result)
          
          // Validate the import data structure
          if (!importData.cards || !Array.isArray(importData.cards)) {
            throw new Error('Invalid progress file format')
          }
          
          // Convert date strings back to Date objects
          const importedCards = importData.cards.map((card: any) => ({
            ...card,
            createdAt: new Date(card.createdAt),
            lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
          }))
          
          // Replace current cards with imported ones
          saveCards(importedCards)
          setCurrentCardIndex(0)
          resolve()
        } catch (error) {
          reject(new Error('Failed to import progress file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  return {
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
  }
}