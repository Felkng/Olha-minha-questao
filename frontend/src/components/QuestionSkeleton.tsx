import React from 'react';
import { Box, Paper, Skeleton, Stack, Divider } from '@mui/material';

export const QuestionSkeleton: React.FC = () => {
  return (
    <Paper
      elevation={4}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        mb: 3,
        position: 'relative',
      }}
    >
      {/* Header Chips Skeleton */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton variant="rounded" width={95} height={28} />
          <Skeleton variant="rounded" width={70} height={24} />
          <Skeleton variant="rounded" width={50} height={24} />
          <Skeleton variant="rounded" width={160} height={24} />
        </Stack>
        <Skeleton variant="circular" width={28} height={28} />
      </Box>

      {/* Enunciado Lines Skeleton */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width="100%" height={24} />
        <Skeleton variant="text" width="96%" height={24} />
        <Skeleton variant="text" width="70%" height={24} />
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Alternatives Skeletons */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {[1, 2, 3, 4, 5].map((item) => (
          <Box
            key={item}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              px: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
            <Skeleton variant="rounded" width={28} height={28} sx={{ mr: 2, flexShrink: 0 }} />
            <Skeleton variant="text" width={`${Math.floor(40 + (item * 12))}%`} height={20} />
          </Box>
        ))}
      </Stack>

      {/* Footer Action Skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton variant="rounded" width={110} height={38} />
      </Box>
    </Paper>
  );
};
