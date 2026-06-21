/**
 * BlockStop Phase 28.2 - Permissions API Endpoints
 * /api/enterprise/permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const resourceType = searchParams.get('resourceType');

    // In production, fetch from database
    const permissions = [
      {
        id: 'perm-create-role',
        name: 'Create Role',
        description: 'Create new roles',
        scope: scope || 'organization',
        action: 'create',
        resourceType: resourceType || 'role',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'perm-read-role',
        name: 'Read Role',
        description: 'Read role information',
        scope: scope || 'organization',
        action: 'read',
        resourceType: resourceType || 'role',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'perm-update-role',
        name: 'Update Role',
        description: 'Update role information',
        scope: scope || 'organization',
        action: 'update',
        resourceType: resourceType || 'role',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'perm-delete-role',
        name: 'Delete Role',
        description: 'Delete roles',
        scope: scope || 'organization',
        action: 'delete',
        resourceType: resourceType || 'role',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'perm-manage-permissions',
        name: 'Manage Permissions',
        description: 'Manage system permissions',
        scope: scope || 'global',
        action: 'manage',
        resourceType: resourceType || 'permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'perm-audit-log',
        name: 'Audit Log Access',
        description: 'Access audit logs',
        scope: scope || 'organization',
        action: 'read',
        resourceType: resourceType || 'audit_log',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: permissions,
      count: permissions.length,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, scope, action, resourceType, conditions } = body;

    if (!name || !scope || !action || !resourceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['create', 'read', 'update', 'delete', 'execute', 'manage', 'approve', 'export', 'audit', 'configure', 'share', 'transfer'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // In production, create in database
    const newPermission = {
      id: `perm-${Date.now()}`,
      name,
      description,
      scope,
      action,
      resourceType,
      conditions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newPermission,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('permissionId');

    if (!permissionId) {
      return NextResponse.json(
        { error: 'permissionId is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, conditions } = body;

    // In production, update in database
    const updatedPermission = {
      id: permissionId,
      name: name || 'Updated Permission',
      description: description || '',
      conditions,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: updatedPermission,
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('permissionId');

    if (!permissionId) {
      return NextResponse.json(
        { error: 'permissionId is required' },
        { status: 400 }
      );
    }

    // In production, delete from database
    return NextResponse.json({
      success: true,
      message: `Permission ${permissionId} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
}
