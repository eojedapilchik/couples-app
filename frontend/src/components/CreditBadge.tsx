import { Chip } from '@mui/material';
import { MonetizationOn as CreditIcon } from '@mui/icons-material';
import { useCredits } from '../hooks/useCredits';

export default function CreditBadge() {
  const { balance, isLoading } = useCredits();

  return (
    <Chip
      icon={<CreditIcon />}
      label={isLoading ? '...' : balance}
      color="primary"
      variant="outlined"
      size="small"
      sx={{ fontWeight: 700 }}
    />
  );
}
