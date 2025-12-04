// app/api/templates/[templateId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

/**
 * DELETE /api/templates/[templateId]
 * Delete a template (ownership verified)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const templateId = parseInt(params.templateId);
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const userId = user.userId;

      // Delete template (ownership check in WHERE clause)
      const deleteResult = await client.query(
        'DELETE FROM event_templates WHERE template_id = $1 AND user_id = $2 RETURNING template_id',
        [templateId, userId]
      );

      if (deleteResult.rows.length === 0) {
        return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Template deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
