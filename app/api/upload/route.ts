// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/api-client';
import { uploadImage } from '@/lib/cloudinary';
import { APIResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Only image files are allowed',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'File size must be less than 5MB',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with optimizations
    const result = await uploadImage(buffer, {
      folder: `game-count-system/${folder}`,
      transformation: {
        width: 800,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
      },
    });

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        url: result.url,
        publicId: result.public_id,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: error.message || 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}
