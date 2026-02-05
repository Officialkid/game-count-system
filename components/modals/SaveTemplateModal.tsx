// components/modals/SaveTemplateModal.tsx
'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateName: string) => void;
  currentEventName: string;
}

export function SaveTemplateModal({ isOpen, onClose, onSave, currentEventName }: SaveTemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [eventPrefix, setEventPrefix] = useState(currentEventName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateName.trim() && eventPrefix.trim()) {
      onSave(templateName.trim());
      setTemplateName('');
      setEventPrefix(currentEventName);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save as Template">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-2">
            Template Name
          </label>
          <input
            id="template-name"
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Weekly Game Night"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
            required
          />
          <p className="mt-1 text-xs text-gray-700">
            A descriptive name for this template
          </p>
        </div>

        <div>
          <label htmlFor="event-prefix" className="block text-sm font-medium text-gray-700 mb-2">
            Default Event Name
          </label>
          <input
            id="event-prefix"
            type="text"
            value={eventPrefix}
            onChange={(e) => setEventPrefix(e.target.value)}
            placeholder="e.g., Game Night"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
            required
          />
          <p className="mt-1 text-xs text-gray-700">
            The default name for events created from this template
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            ℹ️ This template will save the current event's theme color, logo, scoring settings, and display mode.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Save Template
          </button>
        </div>
      </form>
    </Modal>
  );
}
