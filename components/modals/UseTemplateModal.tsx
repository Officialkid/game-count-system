'use client';

interface UseTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (templateId: number, eventName: string) => void;
}

export function UseTemplateModal({ isOpen, onClose, onUseTemplate }: UseTemplateModalProps) {
  return <div>Template modal disabled</div>;
}

export default UseTemplateModal;
