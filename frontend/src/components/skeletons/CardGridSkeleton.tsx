import React from 'react';
import { Grid, Paper, Box, Skeleton, Stack } from '@mui/material';

interface CardGridSkeletonProps {
  count?: number;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number };
  cardHeight?: number | string;
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  columns = { xs: 12, sm: 6, md: 4 },
  cardHeight = 180,
}) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid
          item
          key={index}
          xs={columns.xs ?? 12}
          sm={columns.sm ?? 6}
          md={columns.md ?? 4}
          lg={columns.lg ?? columns.md ?? 4}
        >
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 3,
              height: cardHeight,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="70%" height={24} />
                  <Skeleton variant="text" width="40%" height={18} />
                </Box>
              </Box>

              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 1.5 }} />
                <Skeleton variant="rounded" width={50} height={24} sx={{ borderRadius: 1.5 }} />
              </Stack>
              <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: 1.5 }} />
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};
