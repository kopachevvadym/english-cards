'use client';

import { Box, Chip, Paper, Typography } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Card } from '@/types/card';

interface GameStatsProps {
  cards: Card[];
  activeCards: Card[];
  includeKnownWords?: boolean;
}

export const GameStats = ({ cards, activeCards, includeKnownWords = false }: GameStatsProps) => {
  const knownCards = cards.filter(card => card.isKnown);
  const totalCards = cards.length;
  const learningCards = activeCards.length;

  // Calculate statistics
  const completionRate = totalCards > 0 ? Math.round((knownCards.length / totalCards) * 100) : 0;

  // Determine level based on known words
  const getLevel = (knownCount: number) => {
    if (knownCount < 5) return { level: 1, title: 'Beginner' };
    if (knownCount < 15) return { level: 2, title: 'Learner' };
    if (knownCount < 30) return { level: 3, title: 'Student' };
    if (knownCount < 50) return { level: 4, title: 'Scholar' };
    if (knownCount < 100) return { level: 5, title: 'Expert' };
    return { level: 6, title: 'Master' };
  };

  const { level, title } = getLevel(knownCards.length);

  // Get motivational message
  const getMotivationalMessage = () => {
    if (includeKnownWords) {
      return '📚 Reviewing all words - great for reinforcement!';
    }
    if (completionRate === 100) return '🎉 Perfect! You\'ve mastered all words!';
    if (completionRate >= 80) return '🔥 Almost there! Keep going!';
    if (completionRate >= 60) return '💪 Great progress! You\'re doing well!';
    if (completionRate >= 40) return '📈 Good momentum! Keep it up!';
    if (completionRate >= 20) return '🌱 Nice start! Building your vocabulary!';
    return '🚀 Ready to learn? Let\'s build your vocabulary!';
  };

  const stats = [
    {
      icon: <TrophyIcon sx={{ color: 'warning.main' }} />,
      label: 'Level',
      value: `${level} - ${title}`,
      color: 'warning.main',
    },
    {
      icon: <TrendingUpIcon sx={{ color: 'success.main' }} />,
      label: 'Known Words',
      value: `${knownCards.length}`,
      color: 'success.main',
    },
    {
      icon: <SpeedIcon sx={{ color: 'info.main' }} />,
      label: 'Completion',
      value: `${completionRate}%`,
      color: 'info.main',
    },
    {
      icon: <SchoolIcon sx={{ color: 'primary.main' }} />,
      label: includeKnownWords ? 'Training' : 'Learning',
      value: `${learningCards}`,
      color: 'primary.main',
    },
  ];

  return (
    <Box sx={{ width: 520, maxWidth: { xs: '100%', sm: 320 }, mt: 1 }}>
      <Paper
        elevation={1}
        sx={{
          p: { xs: 0.75, sm: 1 },
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: 1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            textAlign: 'center',
            fontWeight: 600,
            color: 'text.primary',
            mb: { xs: 0.5, sm: 0.75 },
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            lineHeight: 1.2,
            display: 'block',
          }}
        >
          📊 {getMotivationalMessage()}
        </Typography>

        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: { xs: 0.25, sm: 0.5 },
          flexWrap: 'nowrap',
        }}>
          {stats.map((stat, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                p: { xs: 0.5, sm: 0.75 },
                bgcolor: 'white',
                borderRadius: 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                minWidth: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <Box sx={{ mb: 0.25, '& svg': { fontSize: { xs: '0.875rem', sm: '1rem' } } }}>
                {stat.icon}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: stat.color,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  textAlign: 'center',
                  fontSize: { xs: '0.5rem', sm: '0.6rem' },
                  lineHeight: 1,
                  mt: 0.1,
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
            gap: 0.25,
            mt: { xs: 0.5, sm: 0.75 },
            flexWrap: 'wrap',
          }}>
            {knownCards.length >= 5 && (
              <Chip
                label="🎯"
                size="small"
                color="success"
                variant="outlined"
                sx={{
                  height: 16,
                  fontSize: '0.5rem',
                  '& .MuiChip-label': { px: 0.25 },
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
                  height: 16,
                  fontSize: '0.5rem',
                  '& .MuiChip-label': { px: 0.25 },
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
                  height: 16,
                  fontSize: '0.5rem',
                  '& .MuiChip-label': { px: 0.25 },
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
                  height: 16,
                  fontSize: '0.5rem',
                  '& .MuiChip-label': { px: 0.25 },
                }}
              />
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};