import { redirect } from 'next/navigation';

export default function PublicScoreboardPage({ params }: { params: { token: string } }) {
  redirect(`/scoreboard/${params.token}`);
}
