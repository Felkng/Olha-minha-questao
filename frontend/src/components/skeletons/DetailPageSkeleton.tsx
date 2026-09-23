import React from 'react';
import { Box, Paper, Skeleton, Stack, Divider } from '@mui/material';

interface DetailPageSkeletonProps {
  showItemsList?: boolean;
}

export const DetailPageSkeleton: React.FC<DetailPageSkeletonProps> = ({ showItemsList = true }) => {
  return (
    <Box sx={{ mb: 6 }}>
      {/* Back button skeleton */}
      <Skeleton variant="rounded" width={140} height={36} sx={{ mb: 3, borderRadius: 2 }} />

      {/* Main hero card skeleton */}
      <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Skeleton variant="text" width="80%" height={38} />
            <Skeleton variant="text" width="50%" height={24} sx={{ mb: 1.5 }} />

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Skeleton variant="rounded" width={90} height={26} sx={{ borderRadius: 1.5 }} />
              <Skeleton variant="rounded" width={80} height={26} sx={{ borderRadius: 1.5 }} />
              <Skeleton variant="rounded" width={70} height={26} sx={{ borderRadius: 1.5 }} />
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Skeleton variant="rounded" width={110} height={40} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" width={130} height={40} sx={{ borderRadius: 2 }} />
          </Stack>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Skeleton variant="text" width="95%" height={22} />
        <Skeleton variant="text" width="90%" height={22} />
        <Skeleton variant="text" width="65%" height={22} />
      </Paper>

      {/* Items list or questions skeleton */}
      {showItemsList && (
        <Paper elevation={3} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="rounded" width={100} height={32} sx={{ borderRadius: 2 }} />
          </Box>
          <Stack spacing={2}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} variant="rounded" height={72} sx={{ borderRadius: 2.5 }} />
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};
