import { useSearchParams } from 'react-router-dom';
import { BookingForm } from './BookingForm';

export function BookingPage() {
  const [params] = useSearchParams();
  return <BookingForm key={params.toString()} />;
}
