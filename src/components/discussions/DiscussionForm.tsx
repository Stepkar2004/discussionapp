// src/components/discussions/DiscussionForm.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, X, Globe, Users, Lock } from 'lucide-react';
import { Discussion } from '../../types';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { useAuthStore } from '../../stores/authStore';
import { PRIVACY_OPTIONS } from '../../lib/constants';

interface DiscussionFormData {
  title: string;
  description: string;
  privacy: 'public' | 'private' | 'friends';
  tags: string;
}

interface DiscussionFormProps {
  discussion?: Discussion;
  onSuccess: (discussionId: string) => void;
  onCancel: () => void;
}

export function DiscussionForm({ discussion, onSuccess, onCancel }: DiscussionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); // Add state for form-specific errors
  const { createDiscussion, updateDiscussion } = useDiscussionsStore();
  const { user } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<DiscussionFormData>({
    defaultValues: {
      title: discussion?.title || '',
      description: discussion?.description || '',
      privacy: discussion?.privacy || 'public',
      tags: discussion?.tags?.join(', ') || ''
    }
  });

  const watchPrivacy = watch('privacy');

  const onSubmit = async (data: DiscussionFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    setFormError(null);
    
    try {
      const tags = data.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      if (discussion) {
        // Update existing discussion
        await updateDiscussion(discussion.id, {
          title: data.title.trim(),
          description: data.description.trim(),
          privacy: data.privacy,
          tags: tags.length > 0 ? tags : undefined
        });
        onSuccess(discussion.id);
      } else {
        // Create new discussion
        const newDiscussionId = await createDiscussion({
          title: data.title.trim(),
          description: data.description.trim(),
          privacy: data.privacy,
          tags: tags.length > 0 ? tags : undefined
        });
        onSuccess(newDiscussionId);
      }
    } catch (error: any) {
      console.error('Error saving discussion:', error);
      setFormError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'friends':
        return <Users className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {discussion ? 'Edit Discussion' : 'Create New Discussion'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Form Error Message */}
          {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md">
                  {formError}
              </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Discussion Title *
            </label>
            <input
              id="title"
              type="text"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' },
                maxLength: { value: 100, message: 'Title must be less than 100 characters' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a descriptive title for your discussion"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Description must be at least 10 characters' },
                maxLength: { value: 500, message: 'Description must be less than 500 characters' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Describe what this discussion is about, what questions you want to explore, or what arguments you want to analyze..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Privacy Settings *
            </label>
            <div className="space-y-3">
              {PRIVACY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    watchPrivacy === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...register('privacy', { required: 'Privacy setting is required' })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {getPrivacyIcon(option.value)}
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.privacy && (
              <p className="mt-1 text-sm text-red-600">{errors.privacy.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <input
              id="tags"
              type="text"
              {...register('tags')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="philosophy, ethics, logic, debate (separate with commas)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Add tags to help others find your discussion. Separate multiple tags with commas.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{discussion ? 'Update' : 'Create'} Discussion</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}