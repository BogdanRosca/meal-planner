import { useLocation } from 'react-router-dom';

export const useSelectedCategory = (): string => {
  const location = useLocation();
  return (
    (location.state as { category?: string } | null)?.category ??
    'All Categories'
  );
};
