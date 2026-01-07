'use client';

interface EventSetupWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
  editEventId?: string;
  initialData?: any;
}

export function EventSetupWizard(props: EventSetupWizardProps) {
  return <div>Event setup wizard disabled</div>;
}

export default EventSetupWizard;
