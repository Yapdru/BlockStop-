import { query } from '@/lib/db';
import crypto from 'crypto';

export interface DashboardWidget {
  id: string;
  type: string;
  metric: string;
  title?: string;
  description?: string;
  refreshRate?: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  config?: Record<string, any>;
}

export interface DashboardConfig {
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  refreshInterval?: number;
  tags?: string[];
  isPublic?: boolean;
}

export class DashboardGenerator {
  /**
   * Generate a new dashboard
   */
  async generateDashboard(config: DashboardConfig): Promise<any> {
    try {
      const dashboardId = crypto.randomUUID();

      // Store dashboard in database
      await query(
        `INSERT INTO dashboards (
          id, name, description, config, is_public, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          dashboardId,
          config.name,
          config.description || null,
          JSON.stringify(config),
          config.isPublic || false,
        ]
      );

      // Add widgets
      for (const widget of config.widgets) {
        await query(
          `INSERT INTO dashboard_widgets (
            id, dashboard_id, widget_type, metric, config, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            widget.id,
            dashboardId,
            widget.type,
            widget.metric,
            JSON.stringify(widget.config || {}),
          ]
        );
      }

      return {
        id: dashboardId,
        ...config,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Dashboard generation error:', error);
      throw error;
    }
  }

  /**
   * Add a widget to a dashboard
   */
  async addWidget(dashboardId: string, widget: DashboardWidget): Promise<void> {
    try {
      const widgetId = widget.id || crypto.randomUUID();

      await query(
        `INSERT INTO dashboard_widgets (
          id, dashboard_id, widget_type, metric, config, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          widgetId,
          dashboardId,
          widget.type,
          widget.metric,
          JSON.stringify(widget.config || {}),
        ]
      );

      // Update dashboard modification time
      await query(
        `UPDATE dashboards SET updated_at = NOW() WHERE id = $1`,
        [dashboardId]
      );
    } catch (error) {
      console.error('Widget addition error:', error);
      throw error;
    }
  }

  /**
   * Remove a widget from a dashboard
   */
  async removeWidget(dashboardId: string, widgetId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM dashboard_widgets WHERE id = $1 AND dashboard_id = $2`,
        [widgetId, dashboardId]
      );

      // Update dashboard modification time
      await query(
        `UPDATE dashboards SET updated_at = NOW() WHERE id = $1`,
        [dashboardId]
      );
    } catch (error) {
      console.error('Widget removal error:', error);
      throw error;
    }
  }

  /**
   * Get a dashboard
   */
  async getDashboard(dashboardId: string): Promise<any> {
    try {
      const dashboardResult = await query(
        `SELECT * FROM dashboards WHERE id = $1`,
        [dashboardId]
      );

      if (dashboardResult.rows.length === 0) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }

      const dashboard = dashboardResult.rows[0];

      // Get widgets
      const widgetsResult = await query(
        `SELECT * FROM dashboard_widgets WHERE dashboard_id = $1`,
        [dashboardId]
      );

      return {
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        widgets: widgetsResult.rows.map((w: any) => ({
          id: w.id,
          type: w.widget_type,
          metric: w.metric,
          config: w.config,
        })),
        isPublic: dashboard.is_public,
        createdAt: dashboard.created_at,
        updatedAt: dashboard.updated_at,
      };
    } catch (error) {
      console.error('Dashboard retrieval error:', error);
      throw error;
    }
  }

  /**
   * Update a dashboard
   */
  async updateDashboard(
    dashboardId: string,
    config: Partial<DashboardConfig>
  ): Promise<any> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (config.name) {
        updateFields.push(`name = $${paramIndex++}`);
        params.push(config.name);
      }

      if (config.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        params.push(config.description);
      }

      if (config.isPublic !== undefined) {
        updateFields.push(`is_public = $${paramIndex++}`);
        params.push(config.isPublic);
      }

      params.push(dashboardId);

      if (updateFields.length > 0) {
        await query(
          `UPDATE dashboards SET ${updateFields.join(', ')}, updated_at = NOW()
           WHERE id = $${paramIndex}`,
          params
        );
      }

      return this.getDashboard(dashboardId);
    } catch (error) {
      console.error('Dashboard update error:', error);
      throw error;
    }
  }

  /**
   * Delete a dashboard
   */
  async deleteDashboard(dashboardId: string): Promise<void> {
    try {
      // Delete widgets first
      await query(
        `DELETE FROM dashboard_widgets WHERE dashboard_id = $1`,
        [dashboardId]
      );

      // Delete dashboard
      await query(`DELETE FROM dashboards WHERE id = $1`, [dashboardId]);
    } catch (error) {
      console.error('Dashboard deletion error:', error);
      throw error;
    }
  }

  /**
   * List dashboards
   */
  async listDashboards(
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM dashboards ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows || [];
    } catch (error) {
      console.error('Dashboard listing error:', error);
      return [];
    }
  }

  /**
   * Share a dashboard
   */
  async shareDashboard(
    dashboardId: string,
    userIds: string[]
  ): Promise<void> {
    try {
      for (const userId of userIds) {
        await query(
          `INSERT INTO dashboard_shares (dashboard_id, user_id, created_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (dashboard_id, user_id) DO NOTHING`,
          [dashboardId, userId]
        );
      }
    } catch (error) {
      console.error('Dashboard sharing error:', error);
      throw error;
    }
  }

  /**
   * Get shared dashboards
   */
  async getSharedDashboards(userId: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT d.* FROM dashboards d
         JOIN dashboard_shares ds ON d.id = ds.dashboard_id
         WHERE ds.user_id = $1
         ORDER BY ds.created_at DESC`,
        [userId]
      );

      return result.rows || [];
    } catch (error) {
      console.error('Shared dashboards retrieval error:', error);
      return [];
    }
  }

  /**
   * Get widget data
   */
  async getWidgetData(widgetId: string): Promise<any> {
    try {
      const result = await query(
        `SELECT * FROM dashboard_widgets WHERE id = $1`,
        [widgetId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const widget = result.rows[0];

      // Execute the metric query to get data
      const metric = widget.metric;
      const metricQuery = `SELECT * FROM ${metric} LIMIT 100`;

      const dataResult = await query(metricQuery, []);

      return {
        id: widget.id,
        type: widget.widget_type,
        metric: widget.metric,
        data: dataResult.rows,
        config: widget.config,
      };
    } catch (error) {
      console.error('Widget data retrieval error:', error);
      return null;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    totalDashboards: number;
    publicDashboards: number;
    totalWidgets: number;
    averageWidgetsPerDashboard: number;
  }> {
    try {
      const dashResult = await query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN is_public = TRUE THEN 1 ELSE 0 END) as public
         FROM dashboards`,
        []
      );

      const widgetResult = await query(
        `SELECT COUNT(*) as total FROM dashboard_widgets`,
        []
      );

      const dashStats = dashResult.rows[0] || {};
      const widgetStats = widgetResult.rows[0] || {};

      const totalDashboards = dashStats.total || 0;
      const publicDashboards = dashStats.public || 0;
      const totalWidgets = widgetStats.total || 0;
      const avgWidgets = totalDashboards > 0 ? totalWidgets / totalDashboards : 0;

      return {
        totalDashboards,
        publicDashboards,
        totalWidgets,
        averageWidgetsPerDashboard: Math.round(avgWidgets * 100) / 100,
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return {
        totalDashboards: 0,
        publicDashboards: 0,
        totalWidgets: 0,
        averageWidgetsPerDashboard: 0,
      };
    }
  }
}

export const dashboardGenerator = new DashboardGenerator();
