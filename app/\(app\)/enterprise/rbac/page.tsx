'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button, Tabs, Badge } from '@/components';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';
import { BarChart } from '@/app/components/charts/BarChart';

interface Role {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  permissions: any[];
  permissionIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  scope: string;
  action: string;
  resourceType: string;
}

export default function RBACPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roles');
  const [error, setError] = useState('');
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showCreatePermission, setShowCreatePermission] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });
  const [newPermission, setNewPermission] = useState({
    name: '',
    description: '',
    scope: 'organization',
    action: 'read',
    resourceType: '',
  });

  const organizationId = 'org-default';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`/api/enterprise/roles?organizationId=${organizationId}`),
        fetch('/api/enterprise/permissions'),
      ]);

      if (rolesRes.ok && permsRes.ok) {
        const rolesData = await rolesRes.json();
        const permsData = await permsRes.json();
        setRoles(rolesData.data);
        setPermissions(permsData.data);
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/enterprise/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRole,
          organizationId,
        }),
      });

      if (response.ok) {
        await fetchData();
        setNewRole({ name: '', description: '', permissions: [] });
        setShowCreateRole(false);
      }
    } catch (err) {
      setError('Failed to create role');
    }
  };

  const handleCreatePermission = async () => {
    try {
      const response = await fetch('/api/enterprise/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPermission),
      });

      if (response.ok) {
        await fetchData();
        setNewPermission({
          name: '',
          description: '',
          scope: 'organization',
          action: 'read',
          resourceType: '',
        });
        setShowCreatePermission(false);
      }
    } catch (err) {
      setError('Failed to create permission');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`/api/enterprise/roles?roleId=${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      setError('Failed to delete role');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <FadeIn>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">RBAC Management</h1>
              <p className="text-gray-400 mt-2">
                Advanced Role-Based Access Control with fine-grained permissions
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateRole(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Role
              </Button>
              <Button
                onClick={() => setShowCreatePermission(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create Permission
              </Button>
            </div>
          </div>
        </FadeIn>

        {error && (
          <FadeIn>
            <Card className="bg-red-900/20 border-red-700 p-4">
              <p className="text-red-400">{error}</p>
            </Card>
          </FadeIn>
        )}

        <FadeIn>
          <Tabs
            tabs={[
              { id: 'roles', label: 'Roles', badge: roles.length },
              { id: 'permissions', label: 'Permissions', badge: permissions.length },
              { id: 'hierarchy', label: 'Team Hierarchy' },
              { id: 'audit', label: 'Audit Trail' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </FadeIn>

        {activeTab === 'roles' && (
          <FadeIn>
            <div className="space-y-4">
              {showCreateRole && (
                <Card className="bg-gray-800 p-6 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Create New Role
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Role name"
                      value={newRole.name}
                      onChange={(e) =>
                        setNewRole({ ...newRole, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    />
                    <textarea
                      placeholder="Description"
                      value={newRole.description}
                      onChange={(e) =>
                        setNewRole({ ...newRole, description: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                      rows={3}
                    />
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">
                        Permissions
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {permissions.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 text-gray-300"
                          >
                            <input
                              type="checkbox"
                              checked={newRole.permissions.includes(perm.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRole({
                                    ...newRole,
                                    permissions: [...newRole.permissions, perm.id],
                                  });
                                } else {
                                  setNewRole({
                                    ...newRole,
                                    permissions: newRole.permissions.filter(
                                      (p) => p !== perm.id
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span>{perm.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleCreateRole}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Create
                      </Button>
                      <Button
                        onClick={() => setShowCreateRole(false)}
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {roles.map((role) => (
                <Card key={role.id} className="bg-gray-800 p-6 border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        {role.name}
                        {role.type === 'system' && (
                          <Badge variant="blue" text="System" />
                        )}
                        {role.isActive ? (
                          <Badge variant="green" text="Active" />
                        ) : (
                          <Badge variant="red" text="Inactive" />
                        )}
                      </h3>
                      <p className="text-gray-400 mt-1">{role.description}</p>
                    </div>
                    {role.type === 'custom' && (
                      <Button
                        onClick={() => handleDeleteRole(role.id)}
                        className="bg-red-600 hover:bg-red-700 text-sm"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Permissions</p>
                      <p className="text-white font-semibold">
                        {role.permissionIds.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Created</p>
                      <p className="text-white font-semibold">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Updated</p>
                      <p className="text-white font-semibold">
                        {new Date(role.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </FadeIn>
        )}

        {activeTab === 'permissions' && (
          <FadeIn>
            <div className="space-y-4">
              {showCreatePermission && (
                <Card className="bg-gray-800 p-6 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Create New Permission
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Permission name"
                      value={newPermission.name}
                      onChange={(e) =>
                        setNewPermission({ ...newPermission, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    />
                    <textarea
                      placeholder="Description"
                      value={newPermission.description}
                      onChange={(e) =>
                        setNewPermission({
                          ...newPermission,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">
                          Scope
                        </label>
                        <select
                          value={newPermission.scope}
                          onChange={(e) =>
                            setNewPermission({
                              ...newPermission,
                              scope: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="global">Global</option>
                          <option value="organization">Organization</option>
                          <option value="team">Team</option>
                          <option value="project">Project</option>
                          <option value="resource">Resource</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">
                          Action
                        </label>
                        <select
                          value={newPermission.action}
                          onChange={(e) =>
                            setNewPermission({
                              ...newPermission,
                              action: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="create">Create</option>
                          <option value="read">Read</option>
                          <option value="update">Update</option>
                          <option value="delete">Delete</option>
                          <option value="manage">Manage</option>
                          <option value="execute">Execute</option>
                        </select>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Resource Type"
                      value={newPermission.resourceType}
                      onChange={(e) =>
                        setNewPermission({
                          ...newPermission,
                          resourceType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    />
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleCreatePermission}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Create
                      </Button>
                      <Button
                        onClick={() => setShowCreatePermission(false)}
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {permissions.map((perm) => (
                <Card key={perm.id} className="bg-gray-800 p-6 border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {perm.name}
                      </h3>
                      <p className="text-gray-400 mt-1">{perm.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Scope</p>
                      <Badge variant="blue" text={perm.scope} />
                    </div>
                    <div>
                      <p className="text-gray-400">Action</p>
                      <Badge variant="green" text={perm.action} />
                    </div>
                    <div>
                      <p className="text-gray-400">Resource Type</p>
                      <p className="text-white font-semibold">{perm.resourceType}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </FadeIn>
        )}

        {activeTab === 'hierarchy' && (
          <FadeIn>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Team Hierarchy
              </h3>
              <div className="bg-gray-700 rounded p-4 text-gray-300 text-center">
                <p>Team hierarchy visualization coming soon</p>
              </div>
            </Card>
          </FadeIn>
        )}

        {activeTab === 'audit' && (
          <FadeIn>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Audit Trail
              </h3>
              <div className="bg-gray-700 rounded p-4 text-gray-300 text-center">
                <p>RBAC audit trail coming soon</p>
              </div>
            </Card>
          </FadeIn>
        )}
      </div>
    </DashboardLayout>
  );
}
