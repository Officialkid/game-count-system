// components/modals/UseTemplateModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal, LoadingSkeleton } from '@/components/ui';
import { apiClient } from '@/lib/api-client';

interface Template {
  template_id: number;
  template_name: string;
  event_name_prefix: string;
  theme_color: string;
  logo_url: string | null;
  allow_negative: boolean;
  display_mode: string;
  created_at: string;
}

interface UseTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (templateId: number, eventName: string) => void;
}

export function UseTemplateModal({ isOpen, onClose, onUseTemplate }: UseTemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template.template_id);
    setEventName(template.event_name_prefix);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplate && eventName.trim()) {
      onUseTemplate(selectedTemplate, eventName.trim());
      setSelectedTemplate(null);
      setEventName('');
    }
  };

  const selectedTemplateData = templates.find(t => t.template_id === selectedTemplate);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Use Template">
      <form onSubmit={handleSubmit} className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <LoadingSkeleton className="h-20" />
            <LoadingSkeleton className="h-20" />
            <LoadingSkeleton className="h-20" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No templates saved yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Create a template from an event's Settings tab
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.template_id}
                  type="button"
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedTemplate === template.template_id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{template.template_name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Default: {template.event_name_prefix}
                      </p>
                    </div>
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900"
                      style={{ backgroundColor: template.theme_color }}
                      title={`Theme: ${template.theme_color}`}
                    />
                  </div>
                </button>
              ))}
            </div>

            {selectedTemplate && (
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Name
                  </label>
                  <input
                    id="event-name"
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Enter event name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {selectedTemplateData && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-1 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Theme:</strong> {selectedTemplateData.theme_color}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Display Mode:</strong> {selectedTemplateData.display_mode}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Allow Negative:</strong> {selectedTemplateData.allow_negative ? 'Yes' : 'No'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedTemplate || !eventName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 dark:bg-primary-500 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Event
          </button>
        </div>
      </form>
    </Modal>
  );
}
