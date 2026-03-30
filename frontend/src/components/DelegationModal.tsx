'use client';

import { useState } from 'react';
import { User } from '@/types';

interface DelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assigneeId: string) => void;
  coordinators: User[];
  emailSubject: string;
  taskCount: number;
  suggestedRole?: string;
}

const ROLE_LABELS: Record<string, string> = {
  RECEPTION_COORDINATOR: 'Reception',
  DELIVERY_COORDINATOR: 'Delivery',
  DISTRIBUTION_COORDINATOR: 'Distribution',
};

export default function DelegationModal({
  isOpen,
  onClose,
  onConfirm,
  coordinators,
  emailSubject,
  taskCount,
  suggestedRole,
}: DelegationModalProps) {
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Filter coordinators by suggested role
  const relevantCoordinators = suggestedRole
    ? coordinators.filter(c => c.role === suggestedRole)
    : coordinators;

  // Get suggested coordinator
  const suggestedCoordinator = suggestedRole
    ? coordinators.find(c => c.role === suggestedRole)
    : null;

  const handleConfirm = async () => {
    if (!selectedAssignee) return;
    setIsLoading(true);
    try {
      await onConfirm(selectedAssignee);
      onClose();
    } catch (error) {
      console.error('Failed to delegate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '500px',
        maxWidth: '90vw',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a' }}>
            ⚠️ Потврди делегирање
          </h2>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
            Одобери {taskCount} задача{taskCount > 1 ? 'и' : ''} за email
          </p>
        </div>

        {/* Email Subject */}
        <div style={{
          padding: '12px',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#333',
          fontStyle: 'italic',
        }}>
          {emailSubject}
        </div>

        {/* Suggested Role Info */}
        {suggestedRole && (
          <div style={{
            padding: '12px',
            background: '#e6f7ff',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#0066cc',
          }}>
            💡 Препорачан координатор: {ROLE_LABELS[suggestedRole] || suggestedRole}
            {suggestedCoordinator && (
              <span style={{ fontWeight: 'bold', marginLeft: '8px' }}>
                ({suggestedCoordinator.displayName || suggestedCoordinator.email})
              </span>
            )}
          </div>
        )}

        {/* Coordinator Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333',
          }}>
            Избери координатор *
          </label>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white',
            }}
          >
            <option value="">-- Избери координатор --</option>
            {relevantCoordinators.map((coordinator) => (
              <option key={coordinator.id} value={coordinator.id}>
                {coordinator.displayName || coordinator.email} ({ROLE_LABELS[coordinator.role] || coordinator.role})
              </option>
            ))}
            {relevantCoordinators.length === 0 && coordinators.map((coordinator) => (
              <option key={coordinator.id} value={coordinator.id}>
                {coordinator.displayName || coordinator.email} ({ROLE_LABELS[coordinator.role] || coordinator.role})
              </option>
            ))}
          </select>
          {!selectedAssignee && (
            <p style={{ margin: '8px 0 0', color: '#dc2626', fontSize: '12px' }}>
              Мора да изберете координатор
            </p>
          )}
        </div>

        {/* Warning */}
        <div style={{
          padding: '12px',
          background: '#fff3cd',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#856404',
          border: '1px solid #ffeeba',
        }}>
          ⚠️ <strong>Внимание:</strong> Сите задачи ќе бидат доделени на избраниот координатор.
          Проверете дали тој/таа е достапен/а за овие задачи.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              border: '1px solid #ddd',
              background: 'white',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Откажи
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAssignee || isLoading}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: selectedAssignee ? '#22c55e' : '#ccc',
              color: 'white',
              borderRadius: '8px',
              cursor: selectedAssignee && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {isLoading ? 'Се одобрува...' : 'Одобри и додели'}
          </button>
        </div>
      </div>
    </div>
  );
}