import { ExpiredEvent } from '@/components/ExpiredEvent';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <ExpiredEvent 
        title="Event Results Not Found"
        message="The event results you're looking for don't exist or the link has expired. Please check your link and try again."
        showWaitlist={true}
      />
    </div>
  );
}
