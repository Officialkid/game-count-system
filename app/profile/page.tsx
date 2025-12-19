'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { ProtectedPage } from '@/components/AuthGuard';
import { useToast } from '@/components/ui/Toast';
import { storageService } from '@/lib/services';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  contact?: string;
  avatar_url?: string;
}

function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    contact: '',
    avatar_url: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    setLoading(true);
    try {
      const upload = await storageService.uploadTeamAvatar(file, user?.id || 'anonymous', user?.id);
      if (upload.success && upload.data?.fileUrl) {
        setProfileData(prev => ({ ...prev, avatar_url: upload.data!.fileUrl }));
        showToast('Avatar uploaded successfully', 'success');
      } else {
        throw new Error(upload.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast(error.message || 'Failed to upload avatar', 'error');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setLoading(true);
    try {
      // In a real scenario, you'd call an API to save the profile
      // For now, we'll just save locally since Appwrite users don't have custom fields
      // You could extend the users collection for additional fields
      localStorage.setItem(
        `profile_${user?.id}`,
        JSON.stringify({
          name: profileData.name,
          contact: profileData.contact,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString(),
        })
      );
      showToast('Profile updated successfully', 'success');
      setEditing(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">My Profile</h1>
          <p className="text-neutral-600 mt-2">Manage your personal information and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {/* Avatar Section */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-32"></div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end -mt-16 mb-6">
              <div className="relative">
                {preview || profileData.avatar_url ? (
                  <img
                    src={preview || profileData.avatar_url}
                    alt={profileData.name}
                    className="w-32 h-32 rounded-lg object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-neutral-200 border-4 border-white shadow-lg flex items-center justify-center">
                    <User className="w-12 h-12 text-neutral-400" />
                  </div>
                )}
                {editing && (
                  <label className="absolute bottom-2 right-2 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={loading}
                    />
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                  </label>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-lg font-medium text-neutral-900">{profileData.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Address
                </label>
                <p className="text-neutral-600">{profileData.email}</p>
                <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="contact"
                    value={profileData.contact}
                    onChange={handleInputChange}
                    placeholder="e.g., +254745169345"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-neutral-600">{profileData.contact || 'Not provided'}</p>
                )}
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Member Since
                </label>
                <p className="text-neutral-600">
                  Recently joined
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3 pt-6 border-t border-neutral-200">
              {editing ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditing(false);
                      setPreview(null);
                    }}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setEditing(true)}
                    className="flex-1"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/dashboard')}
                    className="flex-1"
                  >
                    Back to Dashboard
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedPage returnUrl="/profile">
      <ProfileContent />
    </ProtectedPage>
  );
}
