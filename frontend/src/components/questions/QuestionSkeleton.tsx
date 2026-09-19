import React from 'react';
import { Box, Paper, Skeleton, Stack, Divider } from '@mui/material';

export const QuestionSkeleton: React.FC = () => {
  return (
    <Paper
      elevation={4}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        mb: 3,
        borderRadius: 3,
      }}
    >
      {/* Header Chips Skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={90} height={28} />
          <Skeleton variant="rounded" width={70} height={28} />
          <Skeleton variant="rounded" width={50} height={28} />
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="circular" width={28} height={28} />
        </Stack>
      </Box>

      {/* Statement Skeleton */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" height={24} width="100%" />
        <Skeleton variant="text" height={24} width="92%" />
        <Skeleton variant="text" height={24} width="78%" />
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Alternatives Skeleton */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {[1, 2, 3, 4, 5].map((idx) => (
          <Skeleton key={idx} variant="rounded" height={48} sx={{ borderRadius: 2.5 }} />
        ))}
      </Stack>

      {/* Footer Action Skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 2 }} />
      </Box>
    </Paper>
  );
};
