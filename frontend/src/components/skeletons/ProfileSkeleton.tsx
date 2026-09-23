import React from 'react';
import { Box, Paper, Skeleton, Stack, Grid } from '@mui/material';

export const ProfileSkeleton: React.FC = () => {
  return (
    <Box sx={{ py: 3 }}>
      {/* Header Profile Hero Card */}
      <Paper elevation={3} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 3 }}>
          <Skeleton variant="circular" width={100} height={100} />

          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Skeleton variant="text" width={220} height={36} sx={{ mx: { xs: 'auto', sm: 0 } }} />
            <Skeleton variant="text" width={160} height={22} sx={{ mx: { xs: 'auto', sm: 0 }, mb: 1.5 }} />

            <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 2 }}>
              <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 1.5 }} />
              <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: 1.5 }} />
            </Stack>

            <Skeleton variant="text" width="80%" height={20} sx={{ mx: { xs: 'auto', sm: 0 } }} />
          </Box>

          <Skeleton variant="rounded" width={130} height={40} sx={{ borderRadius: 2 }} />
        </Box>
      </Paper>

      {/* Metrics Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="50%" height={18} />
                <Skeleton variant="text" width="80%" height={28} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Tabs navigation skeleton */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ pb: 1 }}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} variant="rounded" width={120} height={36} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      </Paper>

      {/* Content Area Skeleton */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
        <Stack spacing={2}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} variant="rounded" height={64} sx={{ borderRadius: 2.5 }} />
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};
