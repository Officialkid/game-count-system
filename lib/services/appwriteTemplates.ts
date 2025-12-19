/**
 * Appwrite Templates Service
 *
 * Save and load event templates
 */

import { databases } from '@/lib/appwrite';
import { Query, ID, Permission, Role } from 'appwrite';

const DATABASE_ID = 'main';
const COLLECTION_ID = 'templates';

export interface Template {
  $id: string;
  user_id: string;
  template_name: string;
  event_name_prefix: string;
  theme_color: string;
  allow_negative: boolean;
  display_mode: string;
  created_at: string;
}

export async function getTemplates(userId: string): Promise<{
  success: boolean;
  data?: { templates: Template[] };
  error?: string;
}> {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('user_id', userId),
      Query.orderDesc('created_at'),
    ]);

    return {
      success: true,
      data: { templates: result.documents as unknown as Template[] },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to load templates' };
  }
}

export async function saveTemplate(
  userId: string,
  input: {
    template_name: string;
    event_name_prefix: string;
    theme_color: string;
    allow_negative: boolean;
    display_mode: string;
  }
): Promise<{ success: boolean; data?: { template: Template }; error?: string }> {
  try {
    const now = new Date().toISOString();

    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        user_id: userId,
        template_name: input.template_name,
        event_name_prefix: input.event_name_prefix,
        theme_color: input.theme_color,
        allow_negative: input.allow_negative,
        display_mode: input.display_mode,
        created_at: now,
      },
      permissions
    );

    return { success: true, data: { template: doc as unknown as Template } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save template' };
  }
}
