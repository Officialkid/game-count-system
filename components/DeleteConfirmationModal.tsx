'use client';

import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  title: string;
  message: string;
  confirmButtonLabel?: string;
  cancelButtonLabel?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmButtonLabel = 'Yes, Delete',
  cancelButtonLabel = 'No, Keep It',
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="md"
      closeOnBackdropClick={!isDeleting}
      closeOnEscKey={!isDeleting}
    >
      <div className="flex gap-3 py-4">
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-neutral-700">{message}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={isDeleting}
        >
          {cancelButtonLabel}
        </Button>
        <Button
          variant="danger"
          size="md"
          onClick={onConfirm}
          isLoading={isDeleting}
          disabled={isDeleting}
        >
          {confirmButtonLabel}
        </Button>
      </div>
    </Modal>
  );
}
