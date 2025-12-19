// components/modals/UseTemplateModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal, LoadingSkeleton } from '@/components/ui';
import { templatesService } from '@/lib/services';
import { useAuth } from '@/lib/auth-context';

interface Template {
  template_id: number;
  template_name: string;
  event_name_prefix: string;
  theme_color: string;
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
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      if (!user?.id) { setTemplates([]); return; }
      const res = await templatesService.getTemplates(user.id);
      if (res.success && res.data) {
        // Map Appwrite templates to local interface
        const mapped = res.data.templates.map((t: any) => ({
          template_id: t.$id,
          template_name: t.template_name,
          event_name_prefix: t.event_name_prefix,
          theme_color: t.theme_color,
          allow_negative: !!t.allow_negative,
          display_mode: t.display_mode,
          created_at: t.created_at,
        })) as unknown as Template[];
        setTemplates(mapped);
      } else {
        setTemplates([]);
      }
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
            <p className="text-gray-500 mb-2">No templates saved yet</p>
            <p className="text-sm text-gray-400">
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
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{template.template_name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Default: {template.event_name_prefix}
                      </p>
                    </div>
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white"
                      style={{ backgroundColor: template.theme_color }}
                      title={`Theme: ${template.theme_color}`}
                    />
                  </div>
                </button>
              ))}
            </div>

            {selectedTemplate && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div>
                  <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name
                  </label>
                  <input
                    id="event-name"
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Enter event name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                    required
                  />
                </div>

                {selectedTemplateData && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                    <p className="text-gray-600">
                      <strong>Theme:</strong> {selectedTemplateData.theme_color}
                    </p>
                    <p className="text-gray-600">
                      <strong>Display Mode:</strong> {selectedTemplateData.display_mode}
                    </p>
                    <p className="text-gray-600">
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedTemplate || !eventName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Event
          </button>
        </div>
      </form>
    </Modal>
  );
}
