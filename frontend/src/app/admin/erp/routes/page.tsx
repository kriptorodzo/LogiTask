'use client';

import { useState, useEffect, useCallback } from 'react';
import PageShell from '@/components/PageShell';

interface RoutePlan {
  id: string;
  destinationCode: string;
  destinationName: string;
  routeDay: string;
  prepOffsetDays: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROUTE_DAYS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

export default function RoutePlansPage() {
  const [routePlans, setRoutePlans] = useState<RoutePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    destinationCode: '',
    destinationName: '',
    routeDay: 'FRIDAY',
    prepOffsetDays: 1,
    active: true,
  });

  const fetchRoutePlans = useCallback(async () => {
    try {
      const response = await fetch('/api/erp/route-plans');
      if (response.ok) {
        const data = await response.json();
        setRoutePlans(data.routePlans || []);
      }
    } catch (error) {
      console.error('Failed to fetch route plans:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutePlans();
  }, [fetchRoutePlans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/erp/route-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          destinationCode: '',
          destinationName: '',
          routeDay: 'FRIDAY',
          prepOffsetDays: 1,
          active: true,
        });
        fetchRoutePlans();
      }
    } catch (error) {
      console.error('Failed to save route plan:', error);
    }
  };

  const handleEdit = (plan: RoutePlan) => {
    setFormData({
      destinationCode: plan.destinationCode,
      destinationName: plan.destinationName,
      routeDay: plan.routeDay,
      prepOffsetDays: plan.prepOffsetDays,
      active: plan.active,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route plan?')) return;

    try {
      const response = await fetch(`/api/erp/route-plans/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRoutePlans();
      }
    } catch (error) {
      console.error('Failed to delete route plan:', error);
    }
  };

  const handleToggleActive = async (plan: RoutePlan) => {
    try {
      await fetch('/api/erp/route-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plan,
          active: !plan.active,
        }),
      });
      fetchRoutePlans();
    } catch (error) {
      console.error('Failed to toggle route plan:', error);
    }
  };

  const getDayLabel = (day: string) => {
    return ROUTE_DAYS.find(d => d.value === day)?.label || day;
  };

  return (
    <PageShell title="Route Plans" subtitle="Manage distribution routes">
      <div style={{ padding: '24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div></div>
          <button
            onClick={() => {
              setFormData({
                destinationCode: '',
                destinationName: '',
                routeDay: 'FRIDAY',
                prepOffsetDays: 1,
                active: true,
              });
              setEditingId(null);
              setShowForm(true);
            }}
            style={{
              padding: '12px 24px',
              border: 'none',
            background: '#1976d2',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          + Add Route Plan
        </button>
      </div>

      {/* Route Plans Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : routePlans.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          border: '1px dashed #e0e0e0',
          borderRadius: '8px',
          color: '#666'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '16px' }}>No route plans configured</p>
          <p>Create route plans to schedule deliveries by destination.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px',
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Code</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Destination</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Route Day</th>
                <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Prep Offset</th>
                <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routePlans.map(plan => (
                <tr key={plan.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {plan.destinationCode}
                  </td>
                  <td style={{ padding: '16px' }}>{plan.destinationName}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      background: '#e3f2fd',
                      color: '#1565c0',
                      fontSize: '13px',
                    }}>
                      {getDayLabel(plan.routeDay)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {plan.prepOffsetDays} day(s) before
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleActive(plan)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: plan.active ? '#e8f5e9' : '#fafafa',
                        color: plan.active ? '#2e7d32' : '#999',
                        fontSize: '12px',
                        border: plan.active ? 'none' : '1px solid #e0e0e0',
                      }}
                    >
                      {plan.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleEdit(plan)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #e0e0e0',
                        background: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '8px',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #f44336',
                        background: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#f44336',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
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
            borderRadius: '8px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
              {editingId ? 'Edit Route Plan' : 'Add Route Plan'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Destination Code
                </label>
                <input
                  type="text"
                  value={formData.destinationCode}
                  onChange={(e) => setFormData({ ...formData, destinationCode: e.target.value.toUpperCase() })}
                  required
                  disabled={!!editingId}
                  placeholder="e.g., BT, SK, OH"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    background: editingId ? '#f5f5f5' : 'white',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Destination Name
                </label>
                <input
                  type="text"
                  value={formData.destinationName}
                  onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                  required
                  placeholder="e.g., Битола, Скопје"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Route Day
                </label>
                <select
                  value={formData.routeDay}
                  onChange={(e) => setFormData({ ...formData, routeDay: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  {ROUTE_DAYS.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Prep Offset Days
                </label>
                <input
                  type="number"
                  value={formData.prepOffsetDays}
                  onChange={(e) => setFormData({ ...formData, prepOffsetDays: parseInt(e.target.value) || 1 })}
                  min="0"
                  max="7"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                  Days before route day when preparation tasks become due
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ marginRight: '8px', width: '18px', height: '18px' }}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #e0e0e0',
                    background: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: '#1976d2',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div style={{
        marginTop: '32px',
        padding: '20px',
        background: '#e3f2fd',
        borderRadius: '8px',
        borderLeft: '4px solid #1976d2',
      }}>
        <h3 style={{ marginBottom: '12px', fontWeight: 'bold' }}>How Route Plans Work</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#333' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Route Day:</strong> The day when distribution tasks are due
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Prep Offset:</strong> Days before route when preparation tasks become due
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Example:</strong> If route is Friday with 1-day prep offset, "Подготви" tasks are due Thursday
          </li>
        </ul>
      </div>
    </div>
    </PageShell>
  );
}