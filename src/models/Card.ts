import mongoose, { Schema, Document } from 'mongoose'

export interface ICard extends Document {
  _id: string
  userId: string
  word: string
  translation: string
  isKnown: boolean
  createdAt: Date
  lastReviewed?: Date
  updatedAt: Date
}

const CardSchema = new Schema<ICard>({
  userId: {
    type: String,
    required: true,
    default: 'default_user'
  },
  word: {
    type: String,
    required: true,
    trim: true
  },
  translation: {
    type: String,
    required: true,
    trim: true
  },
  isKnown: {
    type: Boolean,
    default: false
  },
  lastReviewed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

// Create indexes
CardSchema.index({ userId: 1 })
CardSchema.index({ word: 1 })
CardSchema.index({ isKnown: 1 })
CardSchema.index({ createdAt: 1 })

export default mongoose.models.Card || mongoose.model<ICard>('Card', CardSchema)