'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/types/card'

export const useCards = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)

  useEffect(() => {
    const savedCards = localStorage.getItem('enki-cards')
    if (savedCards) {
      const parsedCards = JSON.parse(savedCards).map((card: any) => ({
        ...card,
        createdAt: new Date(card.createdAt),
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
      }))
      setCards(parsedCards)
    }
  }, [])

  const saveCards = (newCards: Card[]) => {
    setCards(newCards)
    localStorage.setItem('enki-cards', JSON.stringify(newCards))
  }

  const importCards = (jsonData: any[]) => {
    const newCards: Card[] = jsonData.flatMap((item, index) => {
      // Handle {"word": "translation"} format
      return Object.entries(item).map(([word, translation], entryIndex) => ({
        id: `${Date.now()}-${index}-${entryIndex}`,
        word: word,
        translation: translation as string,
        isKnown: false,
        createdAt: new Date(),
      }))
    })
    
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
        ? { ...card, lastReviewed: new Date() }
        : card
    )
    saveCards(updatedCards)
  }

  const getActiveCards = () => cards.filter(card => !card.isKnown)

  const resetProgress = () => {
    const resetCards = cards.map(card => ({ ...card, isKnown: false }))
    saveCards(resetCards)
    setCurrentCardIndex(0)
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
  }
}