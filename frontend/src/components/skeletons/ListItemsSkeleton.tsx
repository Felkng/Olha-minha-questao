import React from 'react';
import { Paper, Box, Skeleton, Stack } from '@mui/material';

interface ListItemsSkeletonProps {
  count?: number;
}

export const ListItemsSkeleton: React.FC<ListItemsSkeletonProps> = ({ count = 4 }) => {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Paper
          key={index}
          elevation={2}
          sx={{
            p: 2.5,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 200 }}>
            <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="35%" height={18} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" width={100} height={32} sx={{ borderRadius: 2 }} />
          </Box>
        </Paper>
      ))}
    </Stack>
  );
};
