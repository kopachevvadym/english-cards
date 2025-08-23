import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Card from '@/models/Card'

// PUT /api/cards/[id] - Update a card
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id } = params
    
    const updatedCard = await Card.findByIdAndUpdate(
      id,
      {
        ...body,
        lastReviewed: body.lastReviewed ? new Date(body.lastReviewed) : new Date()
      },
      { new: true }
    )
    
    if (!updatedCard) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updatedCard
    })
  } catch (error) {
    console.error('Error updating card:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update card' },
      { status: 500 }
    )
  }
}

// DELETE /api/cards/[id] - Delete a card
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { id } = params
    
    const deletedCard = await Card.findByIdAndDelete(id)
    
    if (!deletedCard) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Card deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting card:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}