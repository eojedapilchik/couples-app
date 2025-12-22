import { SvgIcon, SvgIconProps } from '@mui/material';

/**
 * Venus Icon - A flame heart icon representing love points
 */
export default function VenusIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Heart shape with flame effect */}
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
      {/* Flame inside the heart */}
      <path
        d="M12 7c0 0-2 1.5-2 3.5c0 1.1.9 2 2 2s2-.9 2-2C14 8.5 12 7 12 7z"
        fill="#FF6B35"
        opacity="0.9"
      />
      <path
        d="M12 8.5c0 0-1 .75-1 1.75c0 .55.45 1 1 1s1-.45 1-1C13 9.25 12 8.5 12 8.5z"
        fill="#FFD700"
        opacity="0.95"
      />
    </SvgIcon>
  );
}
