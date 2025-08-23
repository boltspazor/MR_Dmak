import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CreateMRForm, MedicalRepresentative, Group, ModalProps } from '../../types';
import { XMarkIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  mrId: yup.string().optional(),
  firstName: yup.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: yup.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: yup.string().optional(),
  email: yup.string().email('Invalid email address').optional(),
  groupId: yup.string().optional(),
  comments: yup.string().optional(),
}).required();

interface EditMRModalProps extends ModalProps {
  mr: MedicalRepresentative | null;
  onSubmit: (id: string, data: Partial<CreateMRForm>) => Promise<void>;
  groups: Group[];
}

const EditMRModal: React.FC<EditMRModalProps> = ({ isOpen, onClose, mr, onSubmit, groups }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<Partial<CreateMRForm>>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (mr) {
      setValue('mrId', mr.mrId);
      setValue('firstName', mr.firstName);
      setValue('lastName', mr.lastName);
      setValue('phone', mr.phone);
      setValue('email', mr.email || '');
      setValue('groupId', mr.groupId);
      setValue('comments', mr.comments || '');
    }
  }, [mr, setValue]);

  const handleFormSubmit = async (data: Partial<CreateMRForm>) => {
    if (!mr) return;
    
    try {
      await onSubmit(mr.id, data);
      reset();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !mr) return null;

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
              <h3 className="text-lg font-medium text-gray-900">Edit Medical Representative</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mrId" className="form-label">
                    MR ID
                  </label>
                  <input
                    {...register('mrId')}
                    type="text"
                    id="mrId"
                    className={`input ${errors.mrId ? 'input-error' : ''}`}
                    placeholder="e.g., MR001"
                  />
                  {errors.mrId && (
                    <p className="form-error">{errors.mrId.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="groupId" className="form-label">
                    Group
                  </label>
                  <select
                    {...register('groupId')}
                    id="groupId"
                    className={`input ${errors.groupId ? 'input-error' : ''}`}
                  >
                    <option value="">Select a group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.groupName}
                      </option>
                    ))}
                  </select>
                  {errors.groupId && (
                    <p className="form-error">{errors.groupId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    id="firstName"
                    className={`input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    className={`input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="form-label">
                    Phone
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className={`input ${errors.phone ? 'input-error' : ''}`}
                    placeholder="+1234567890"
                  />
                  {errors.phone && (
                    <p className="form-error">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="form-error">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="comments" className="form-label">
                  Comments
                </label>
                <textarea
                  {...register('comments')}
                  id="comments"
                  rows={3}
                  className={`input ${errors.comments ? 'input-error' : ''}`}
                  placeholder="Additional notes (optional)"
                />
                {errors.comments && (
                  <p className="form-error">{errors.comments.message}</p>
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
                    'Update MR'
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

export default EditMRModal;
