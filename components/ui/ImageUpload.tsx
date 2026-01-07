'use client';

interface ImageUploadProps {
  onImageSelect?: (file: File) => void;
  onUpload?: (url: string) => void;
}

export function ImageUpload({ onImageSelect, onUpload }: ImageUploadProps) {
  return <div>Image upload disabled</div>;
}

export default ImageUpload;
