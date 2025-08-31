'use client'

import {
  Box,
  Paper,
  Typography,
  Chip,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  School as SchoolIcon,
} from '@mui/icons-material'
import { Card } from '@/types/card'

interface GameStatsProps {
  cards: Card[]
  activeCards: Card[]
  includeKnownWords?: boolean
}

export const GameStats = ({ cards, activeCards, includeKnownWords = false }: GameStatsProps) => {
  const knownCards = cards.filter(card => card.isKnown)
  const totalCards = cards.length
  const learningCards = activeCards.length
  
  // Calculate statistics
  const completionRate = totalCards > 0 ? Math.round((knownCards.length / totalCards) * 100) : 0
  
  // Determine level based on known words
  const getLevel = (knownCount: number) => {
    if (knownCount < 5) return { level: 1, title: 'Beginner' }
    if (knownCount < 15) return { level: 2, title: 'Learner' }
    if (knownCount < 30) return { level: 3, title: 'Student' }
    if (knownCount < 50) return { level: 4, title: 'Scholar' }
    if (knownCount < 100) return { level: 5, title: 'Expert' }
    return { level: 6, title: 'Master' }
  }
  
  const { level, title } = getLevel(knownCards.length)
  
  // Get motivational message
  const getMotivationalMessage = () => {
    if (includeKnownWords) {
      return "📚 Reviewing all words - great for reinforcement!"
    }
    if (completionRate === 100) return "🎉 Perfect! You've mastered all words!"
    if (completionRate >= 80) return "🔥 Almost there! Keep going!"
    if (completionRate >= 60) return "💪 Great progress! You're doing well!"
    if (completionRate >= 40) return "📈 Good momentum! Keep it up!"
    if (completionRate >= 20) return "🌱 Nice start! Building your vocabulary!"
    return "🚀 Ready to learn? Let's build your vocabulary!"
  }

  const stats = [
    {
      icon: <TrophyIcon sx={{ color: 'warning.main' }} />,
      label: 'Level',
      value: `${level} - ${title}`,
      color: 'warning.main'
    },
    {
      icon: <TrendingUpIcon sx={{ color: 'success.main' }} />,
      label: 'Known Words',
      value: `${knownCards.length}`,
      color: 'success.main'
    },
    {
      icon: <SpeedIcon sx={{ color: 'info.main' }} />,
      label: 'Completion',
      value: `${completionRate}%`,
      color: 'info.main'
    },
    {
      icon: <SchoolIcon sx={{ color: 'primary.main' }} />,
      label: includeKnownWords ? 'Training' : 'Learning',
      value: `${learningCards}`,
      color: 'primary.main'
    }
  ]

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 420 }, mt: 2 }}>
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: 2
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            textAlign: 'center', 
            fontWeight: 600,
            color: 'text.primary',
            mb: { xs: 1, sm: 1.5 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            lineHeight: 1.3
          }}
        >
          📊 {getMotivationalMessage()}
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          gap: { xs: 0.5, sm: 1 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}>
          {stats.map((stat, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: { xs: '1 1 45%', sm: 1 },
                p: { xs: 0.75, sm: 1 },
                bgcolor: 'white',
                borderRadius: 1.5,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out',
                minWidth: { xs: 70, sm: 'auto' },
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-1px)' },
                  boxShadow: { xs: '0 1px 3px rgba(0,0,0,0.1)', sm: '0 2px 6px rgba(0,0,0,0.15)' },
                }
              }}
            >
              <Box sx={{ mb: { xs: 0.25, sm: 0.5 }, '& svg': { fontSize: { xs: '1rem', sm: '1.2rem' } } }}>
                {stat.icon}
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700,
                  color: stat.color,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  lineHeight: 1
                }}
              >
                {stat.value}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  textAlign: 'center',
                  fontSize: { xs: '0.6rem', sm: '0.7rem' },
                  lineHeight: 1,
                  mt: { xs: 0.1, sm: 0.25 }
                }}
              >
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Compact achievement badges */}
        {(knownCards.length >= 5 || completionRate >= 50 || completionRate === 100) && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: { xs: 0.25, sm: 0.5 }, 
            mt: { xs: 1, sm: 1.5 },
            flexWrap: 'wrap'
          }}>
            {knownCards.length >= 5 && (
              <Chip 
                label="🎯" 
                size="small" 
                color="success" 
                variant="outlined"
                sx={{ 
                  height: { xs: 18, sm: 20 }, 
                  fontSize: { xs: '0.6rem', sm: '0.7rem' }, 
                  '& .MuiChip-label': { px: { xs: 0.25, sm: 0.5 } } 
                }}
              />
            )}
            {knownCards.length >= 10 && (
              <Chip 
                label="🔟" 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ 
                  height: { xs: 18, sm: 20 }, 
                  fontSize: { xs: '0.6rem', sm: '0.7rem' }, 
                  '& .MuiChip-label': { px: { xs: 0.25, sm: 0.5 } } 
                }}
              />
            )}
            {completionRate >= 50 && (
              <Chip 
                label="🏆" 
                size="small" 
                color="warning" 
                variant="outlined"
                sx={{ 
                  height: { xs: 18, sm: 20 }, 
                  fontSize: { xs: '0.6rem', sm: '0.7rem' }, 
                  '& .MuiChip-label': { px: { xs: 0.25, sm: 0.5 } } 
                }}
              />
            )}
            {completionRate === 100 && (
              <Chip 
                label="👑" 
                size="small" 
                color="error" 
                variant="outlined"
                sx={{ 
                  height: { xs: 18, sm: 20 }, 
                  fontSize: { xs: '0.6rem', sm: '0.7rem' }, 
                  '& .MuiChip-label': { px: { xs: 0.25, sm: 0.5 } } 
                }}
              />
            )}
          </Box>
        )}
      </Paper>
    </Box>
  )
}