import { redirect } from 'next/navigation';

export default function RecapRedirectPage({
  params,
}: {
  params: { token: string };
}) {
  redirect(`/scoreboard/${params.token}`);
}
