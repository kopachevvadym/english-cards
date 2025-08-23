import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Card from '@/models/Card'

// GET /api/cards - Get all cards for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'default_user'
    
    const cards = await Card.find({ userId }).sort({ createdAt: -1 })
    
    return NextResponse.json({
      success: true,
      data: cards
    })
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}

// POST /api/cards - Create new cards
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { cards, userId = 'default_user' } = body
    
    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json(
        { success: false, error: 'Cards array is required' },
        { status: 400 }
      )
    }
    
    // Prepare cards for insertion
    const cardsToInsert = cards.map(card => ({
      userId,
      word: card.word,
      translation: card.translation,
      isKnown: card.isKnown || false,
      lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : null
    }))
    
    const insertedCards = await Card.insertMany(cardsToInsert)
    
    return NextResponse.json({
      success: true,
      data: insertedCards
    })
  } catch (error) {
    console.error('Error creating cards:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create cards' },
      { status: 500 }
    )
  }
}