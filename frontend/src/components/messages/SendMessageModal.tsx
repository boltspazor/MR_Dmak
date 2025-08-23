import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { SendMessageRequest, Group, ModalProps } from '../../types';
import { XMarkIcon, PhotoIcon, CalendarIcon } from '@heroicons/react/24/outline';
import messagesService from '../../services/messages.service';

const schema = yup.object({
  content: yup.string().min(1, 'Message content is required').required('Message content is required'),
  targetGroups: yup.array().of(yup.string()).min(1, 'Select at least one group').required('Target groups are required'),
  imageUrl: yup.string().url('Invalid URL').optional(),
  scheduledAt: yup.string().optional(),
}).required();

interface SendMessageModalProps extends ModalProps {
  onSubmit: (data: SendMessageRequest) => Promise<void>;
  groups: Group[];
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({ isOpen, onClose, onSubmit, groups }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<SendMessageRequest>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      targetGroups: [],
      imageUrl: '',
      scheduledAt: undefined,
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  const watchedTargetGroups = watch('targetGroups');

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const result = await messagesService.uploadImage(file);
      setValue('imageUrl', result.imageUrl);
      setImageFile(null);
    } catch (error: any) {
      console.error('Image upload failed:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (data: SendMessageRequest) => {
    try {
      await onSubmit(data);
      reset();
      setImageFile(null);
      setShowScheduler(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    reset();
    setImageFile(null);
    setShowScheduler(false);
    onClose();
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      handleImageUpload(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Send Message</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label htmlFor="targetGroups" className="form-label">
                  Target Groups *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {groups.map((group) => (
                    <label key={group.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={group.id}
                        {...register('targetGroups')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{group.groupName}</span>
                    </label>
                  ))}
                </div>
                {errors.targetGroups && (
                  <p className="form-error">{errors.targetGroups.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="content" className="form-label">
                  Message Content *
                </label>
                <textarea
                  {...register('content')}
                  id="content"
                  rows={4}
                  className={`input ${errors.content ? 'input-error' : ''}`}
                  placeholder="Enter your message content..."
                />
                {errors.content && (
                  <p className="form-error">{errors.content.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Image Attachment</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="image-upload"
                      className="btn btn-secondary btn-sm cursor-pointer"
                      title="Upload Image"
                    >
                      <PhotoIcon className="h-4 w-4 mr-1" />
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </label>
                    {watch('imageUrl') && (
                      <button
                        type="button"
                        onClick={() => setValue('imageUrl', '')}
                        className="text-sm text-danger-600 hover:text-danger-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {watch('imageUrl') && (
                    <div className="mt-2">
                      <img 
                        src={watch('imageUrl')} 
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">Schedule Message</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowScheduler(!showScheduler)}
                      className="btn btn-secondary btn-sm"
                    >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {showScheduler ? 'Hide Scheduler' : 'Schedule'}
                    </button>
                  </div>
                  {showScheduler && (
                    <div className="mt-2">
                      <input
                        type="datetime-local"
                        {...register('scheduledAt')}
                        className="input"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {watchedTargetGroups && watchedTargetGroups.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Recipients:</strong> This message will be sent to{' '}
                    {watchedTargetGroups.length} group{watchedTargetGroups.length > 1 ? 's' : ''} 
                    ({groups.filter(g => watchedTargetGroups.includes(g.id)).map(g => g.groupName).join(', ')})
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMessageModal;
