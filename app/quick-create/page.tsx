import { redirect } from 'next/navigation';

export default function QuickCreateRedirectPage() {
  redirect('/events/create');
}
