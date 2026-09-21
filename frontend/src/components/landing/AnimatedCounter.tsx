import React, { useEffect, useState } from 'react';
import { Typography, TypographyProps } from '@mui/material';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  typographyProps?: TypographyProps;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1800,
  prefix = '',
  suffix = '',
  typographyProps = {},
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const startValue = 0;
    const endValue = value;

    if (endValue === 0) {
      setDisplayValue(0);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Ease-out cubic easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formattedNumber = new Intl.NumberFormat('pt-BR').format(displayValue);

  return (
    <Typography
      component="span"
      {...typographyProps}
      sx={{
        fontVariantNumeric: 'tabular-nums',
        ...(typographyProps.sx || {}),
      }}
    >
      {prefix}
      {formattedNumber}
      {suffix}
    </Typography>
  );
};
