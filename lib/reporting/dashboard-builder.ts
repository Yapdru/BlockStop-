/**
 * Dashboard Builder - Custom dashboard creation and management
 * Supports drag-drop widget arrangement, real-time updates
 */

import { EventEmitter } from "events";

export type WidgetType = "chart" | "table" | "kpi" | "alert" | "timeline" | "heatmap";
export type ChartType = "line" | "bar" | "pie" | "area" | "scatter";
export type TimeRange = "24h" | "7d" | "30d" | "90d" | "custom";

export interface DashboardWidget {
  widgetId: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: {
    row: number;
    col: number;
    width: number;
    height: number;
  };
  config: {
    dataSource: string; // API endpoint or metric name
    refreshInterval?: number; // milliseconds
    timeRange?: TimeRange;
    filters?: Record<string, unknown>;
    chartType?: ChartType;
    colorScheme?: string;
    showLegend?: boolean;
    aggregation?: "sum" | "avg" | "max" | "min" | "count";
  };
  displayOrder: number;
}

export interface CustomDashboard {
  dashboardId: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: {
    rows: number;
    cols: number;
    gap: number;
  };
  theme: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  isPublic: boolean;
  sharedWith?: string[]; // User IDs
  tags?: string[];
}

export interface DashboardTemplate {
  templateId: string;
  name: string;
  description: string;
  category: "executive" | "technical" | "security" | "operational" | "custom";
  widgets: Omit<DashboardWidget, "widgetId">[];
  thumbnail?: string;
  createdAt: Date;
}

export interface DashboardSnapshot {
  snapshotId: string;
  dashboardId: string;
  timestamp: Date;
  data: Record<string, unknown>; // Cached widget data
}

export class DashboardBuilder extends EventEmitter {
  private dashboards: Map<string, CustomDashboard> = new Map();
  private templates: Map<string, DashboardTemplate> = new Map();
  private snapshots: Map<string, DashboardSnapshot> = new Map();
  private widgetDataCache: Map<string, unknown> = new Map();

  constructor() {
    super();
    this.initializeDefaultTemplates();
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(
    name: string,
    createdBy: string,
    options: {
      description?: string;
      isPublic?: boolean;
      tags?: string[];
      theme?: CustomDashboard["theme"];
    } = {}
  ): Promise<CustomDashboard> {
    const dashboardId = `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const dashboard: CustomDashboard = {
      dashboardId,
      name,
      description: options.description,
      widgets: [],
      layout: {
        rows: 12,
        cols: 12,
        gap: 16,
      },
      theme: options.theme || {
        primaryColor: "#3b82f6",
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        accentColor: "#ef4444",
      },
      createdAt: new Date(),
      createdBy,
      updatedAt: new Date(),
      updatedBy: createdBy,
      isPublic: options.isPublic ?? false,
      sharedWith: [],
      tags: options.tags || [],
    };

    this.dashboards.set(dashboardId, dashboard);
    this.emit("dashboard_created", dashboard);

    return dashboard;
  }

  /**
   * Create dashboard from template
   */
  async createFromTemplate(
    templateId: string,
    dashboardName: string,
    createdBy: string
  ): Promise<CustomDashboard> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const dashboard = await this.createDashboard(dashboardName, createdBy);

    // Add widgets from template
    for (const widgetConfig of template.widgets) {
      await this.addWidget(dashboard.dashboardId, widgetConfig as DashboardWidget);
    }

    return dashboard;
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(dashboardId: string): Promise<CustomDashboard | null> {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * List dashboards
   */
  async listDashboards(
    createdBy?: string,
    options: { includeShared?: boolean } = {}
  ): Promise<CustomDashboard[]> {
    let dashboards = Array.from(this.dashboards.values());

    if (createdBy) {
      dashboards = dashboards.filter(
        (d) =>
          d.createdBy === createdBy ||
          (options.includeShared && d.sharedWith?.includes(createdBy))
      );
    }

    return dashboards.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Update dashboard metadata
   */
  async updateDashboard(
    dashboardId: string,
    updates: Partial<CustomDashboard>
  ): Promise<CustomDashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const updated = {
      ...dashboard,
      ...updates,
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboardId, updated);
    this.emit("dashboard_updated", updated);

    return updated;
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(dashboardId: string): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return false;
    }

    this.dashboards.delete(dashboardId);

    // Clean up snapshots
    Array.from(this.snapshots.entries()).forEach(([key, snapshot]) => {
      if (snapshot.dashboardId === dashboardId) {
        this.snapshots.delete(key);
      }
    });

    this.emit("dashboard_deleted", { dashboardId });
    return true;
  }

  /**
   * Add widget to dashboard
   */
  async addWidget(dashboardId: string, widget: Omit<DashboardWidget, "widgetId">): Promise<DashboardWidget> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const widgetId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newWidget: DashboardWidget = {
      ...widget,
      widgetId,
      displayOrder: dashboard.widgets.length,
    };

    dashboard.widgets.push(newWidget);
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);
    this.emit("widget_added", { dashboardId, widget: newWidget });

    return newWidget;
  }

  /**
   * Update widget on dashboard
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): Promise<DashboardWidget> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const widget = dashboard.widgets.find((w) => w.widgetId === widgetId);
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    const updated = { ...widget, ...updates };
    const index = dashboard.widgets.findIndex((w) => w.widgetId === widgetId);
    dashboard.widgets[index] = updated;

    dashboard.updatedAt = new Date();
    this.dashboards.set(dashboardId, dashboard);

    this.emit("widget_updated", { dashboardId, widget: updated });

    return updated;
  }

  /**
   * Remove widget from dashboard
   */
  async removeWidget(dashboardId: string, widgetId: string): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return false;
    }

    const index = dashboard.widgets.findIndex((w) => w.widgetId === widgetId);
    if (index === -1) {
      return false;
    }

    dashboard.widgets.splice(index, 1);
    dashboard.updatedAt = new Date();

    // Reorder widgets
    dashboard.widgets.forEach((w, i) => {
      w.displayOrder = i;
    });

    this.dashboards.set(dashboardId, dashboard);
    this.emit("widget_removed", { dashboardId, widgetId });

    return true;
  }

  /**
   * Reorder widgets on dashboard
   */
  async reorderWidgets(
    dashboardId: string,
    widgetOrder: Array<{ widgetId: string; displayOrder: number }>
  ): Promise<DashboardWidget[]> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    for (const order of widgetOrder) {
      const widget = dashboard.widgets.find((w) => w.widgetId === order.widgetId);
      if (widget) {
        widget.displayOrder = order.displayOrder;
      }
    }

    dashboard.widgets.sort((a, b) => a.displayOrder - b.displayOrder);
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);
    this.emit("widgets_reordered", { dashboardId });

    return dashboard.widgets;
  }

  /**
   * Share dashboard with users
   */
  async shareDashboard(
    dashboardId: string,
    userIds: string[]
  ): Promise<CustomDashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    dashboard.sharedWith = Array.from(new Set([...(dashboard.sharedWith || []), ...userIds]));
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);
    this.emit("dashboard_shared", { dashboardId, userIds });

    return dashboard;
  }

  /**
   * Cache widget data for snapshot
   */
  async cacheWidgetData(widgetId: string, data: unknown): Promise<void> {
    this.widgetDataCache.set(widgetId, data);
  }

  /**
   * Get cached widget data
   */
  async getWidgetData(widgetId: string): Promise<unknown> {
    return this.widgetDataCache.get(widgetId);
  }

  /**
   * Create dashboard snapshot
   */
  async createSnapshot(dashboardId: string): Promise<DashboardSnapshot> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const snapshotId = `snapshot-${Date.now()}`;
    const data: Record<string, unknown> = {};

    // Collect widget data
    for (const widget of dashboard.widgets) {
      data[widget.widgetId] = await this.getWidgetData(widget.widgetId);
    }

    const snapshot: DashboardSnapshot = {
      snapshotId,
      dashboardId,
      timestamp: new Date(),
      data,
    };

    this.snapshots.set(snapshotId, snapshot);
    this.emit("snapshot_created", snapshot);

    return snapshot;
  }

  /**
   * Get dashboard snapshots
   */
  async getSnapshots(dashboardId: string, limit: number = 10): Promise<DashboardSnapshot[]> {
    return Array.from(this.snapshots.values())
      .filter((s) => s.dashboardId === dashboardId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get available templates
   */
  async getTemplates(category?: string): Promise<DashboardTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (category) {
      templates = templates.filter((t) => t.category === category);
    }

    return templates;
  }

  /**
   * Create custom template from dashboard
   */
  async createTemplate(
    dashboardId: string,
    templateName: string,
    category: DashboardTemplate["category"],
    description: string
  ): Promise<DashboardTemplate> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const templateId = `template-${Date.now()}`;

    const template: DashboardTemplate = {
      templateId,
      name: templateName,
      description,
      category,
      widgets: dashboard.widgets.map(({ widgetId, ...rest }) => rest),
      createdAt: new Date(),
    };

    this.templates.set(templateId, template);
    this.emit("template_created", template);

    return template;
  }

  /**
   * Export dashboard configuration
   */
  async exportDashboard(dashboardId: string): Promise<string> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    return JSON.stringify(dashboard, null, 2);
  }

  /**
   * Import dashboard configuration
   */
  async importDashboard(
    config: string,
    createdBy: string
  ): Promise<CustomDashboard> {
    try {
      const dashboardConfig = JSON.parse(config);

      const dashboard: CustomDashboard = {
        dashboardId: `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: dashboardConfig.name,
        description: dashboardConfig.description,
        widgets: dashboardConfig.widgets.map((w: DashboardWidget) => ({
          ...w,
          widgetId: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
        layout: dashboardConfig.layout || { rows: 12, cols: 12, gap: 16 },
        theme: dashboardConfig.theme,
        createdAt: new Date(),
        createdBy,
        updatedAt: new Date(),
        updatedBy: createdBy,
        isPublic: false,
        sharedWith: [],
        tags: dashboardConfig.tags || [],
      };

      this.dashboards.set(dashboard.dashboardId, dashboard);
      this.emit("dashboard_imported", dashboard);

      return dashboard;
    } catch (error) {
      throw new Error(`Failed to import dashboard: ${error}`);
    }
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const templates: DashboardTemplate[] = [
      {
        templateId: "template-executive",
        name: "Executive Summary",
        description: "High-level overview for leadership",
        category: "executive",
        widgets: [
          {
            type: "kpi",
            title: "Total Threats",
            description: "Critical findings requiring attention",
            position: { row: 0, col: 0, width: 3, height: 2 },
            config: { dataSource: "threats/total" },
            displayOrder: 0,
          },
          {
            type: "chart",
            title: "Threat Trend",
            description: "30-day threat progression",
            position: { row: 0, col: 3, width: 6, height: 4 },
            config: {
              dataSource: "threats/trend",
              chartType: "line",
              timeRange: "30d",
            },
            displayOrder: 1,
          },
        ],
        createdAt: new Date(),
      },
      {
        templateId: "template-security",
        name: "Security Operations",
        description: "Detailed security metrics and alerts",
        category: "security",
        widgets: [
          {
            type: "alert",
            title: "Active Alerts",
            description: "Real-time security alerts",
            position: { row: 0, col: 0, width: 4, height: 3 },
            config: { dataSource: "alerts/active" },
            displayOrder: 0,
          },
        ],
        createdAt: new Date(),
      },
    ];

    for (const template of templates) {
      this.templates.set(template.templateId, template);
    }
  }
}

export default DashboardBuilder;
