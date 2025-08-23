import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CreateGroupForm, Group, ModalProps } from '../../types';
import { XMarkIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  groupName: yup.string().min(2, 'Group name must be at least 2 characters').required('Group name is required'),
  description: yup.string().optional(),
}).required();

interface EditGroupModalProps extends ModalProps {
  group: Group | null;
  onSubmit: (id: string, data: CreateGroupForm) => Promise<void>;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ isOpen, onClose, group, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CreateGroupForm>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (group) {
      setValue('groupName', group.groupName);
      setValue('description', group.description || '');
    }
  }, [group, setValue]);

  const handleFormSubmit = async (data: CreateGroupForm) => {
    if (!group) return;
    
    try {
      await onSubmit(group.id, data);
      reset();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Group</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label htmlFor="groupName" className="form-label">
                  Group Name *
                </label>
                <input
                  {...register('groupName')}
                  type="text"
                  id="groupName"
                  className={`input ${errors.groupName ? 'input-error' : ''}`}
                  placeholder="Enter group name"
                />
                {errors.groupName && (
                  <p className="form-error">{errors.groupName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={3}
                  className={`input ${errors.description ? 'input-error' : ''}`}
                  placeholder="Enter group description (optional)"
                />
                {errors.description && (
                  <p className="form-error">{errors.description.message}</p>
                )}
              </div>

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
                      Updating...
                    </div>
                  ) : (
                    'Update Group'
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

export default EditGroupModal;
