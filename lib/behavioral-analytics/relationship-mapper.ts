/**
 * Relationship Mapper - Maps relationships between entities
 */

export interface EntityRelationship {
  sourceId: string;
  targetId: string;
  type: "collaboration" | "delegation" | "supervision" | "dependency";
  strength: number; // 0 to 1
  frequency: number;
  lastInteraction: Date;
  riskAssociation: number; // 0 to 1
  bidirectional: boolean;
}

export interface RelationshipGraph {
  entityId: string;
  connections: EntityRelationship[];
  riskFactor: number;
  clusterSize: number;
  centralityScore: number;
}

export class RelationshipMapper {
  private relationships: Map<string, EntityRelationship[]> = new Map();
  private graphs: Map<string, RelationshipGraph> = new Map();
  private globalGraph: Map<string, Set<string>> = new Map(); // Adjacency list

  /**
   * Build relationship graph from events
   */
  async buildGraph(
    entities: Array<{ id: string; name: string }>,
    events: Array<{
      timestamp: Date;
      entityId: string;
      action: string;
      targetEntityId?: string;
    }>
  ): Promise<void> {
    // Clear existing graph
    this.relationships.clear();
    this.graphs.clear();
    this.globalGraph.clear();

    // Initialize for all entities
    for (const entity of entities) {
      this.relationships.set(entity.id, []);
      this.globalGraph.set(entity.id, new Set());
    }

    // Build relationships from events
    const relationshipMap = new Map<string, EntityRelationship>();

    for (const event of events) {
      if (!event.targetEntityId) continue;

      const key = `${event.entityId}-${event.targetEntityId}`;
      const existing = relationshipMap.get(key);

      if (existing) {
        existing.frequency++;
        existing.lastInteraction = event.timestamp;
      } else {
        relationshipMap.set(key, {
          sourceId: event.entityId,
          targetId: event.targetEntityId,
          type: this.inferRelationType(event.action),
          strength: 0.5,
          frequency: 1,
          lastInteraction: event.timestamp,
          riskAssociation: 0,
          bidirectional: false,
        });
      }
    }

    // Store relationships
    for (const [, relationship] of relationshipMap) {
      const sourceRelationships = this.relationships.get(relationship.sourceId) || [];
      sourceRelationships.push(relationship);
      this.relationships.set(relationship.sourceId, sourceRelationships);

      // Add to global graph
      const adjacency = this.globalGraph.get(relationship.sourceId) || new Set();
      adjacency.add(relationship.targetId);
      this.globalGraph.set(relationship.sourceId, adjacency);
    }

    // Calculate graph metrics
    for (const entity of entities) {
      const graph = await this.calculateGraphMetrics(entity.id);
      this.graphs.set(entity.id, graph);
    }
  }

  /**
   * Add relationship
   */
  async addRelationship(
    sourceId: string,
    targetId: string,
    type: EntityRelationship["type"],
    strength: number = 0.5
  ): Promise<EntityRelationship> {
    const relationship: EntityRelationship = {
      sourceId,
      targetId,
      type,
      strength: Math.min(1, strength),
      frequency: 1,
      lastInteraction: new Date(),
      riskAssociation: 0,
      bidirectional: false,
    };

    const sourceRelationships = this.relationships.get(sourceId) || [];
    sourceRelationships.push(relationship);
    this.relationships.set(sourceId, sourceRelationships);

    // Add to global graph
    const adjacency = this.globalGraph.get(sourceId) || new Set();
    adjacency.add(targetId);
    this.globalGraph.set(sourceId, adjacency);

    return relationship;
  }

  /**
   * Get relationships for an entity
   */
  async getRelationships(
    entityId: string
  ): Promise<Array<{
    relatedEntityId: string;
    relationshipType: string;
    riskFactor: number;
  }>> {
    const rels = this.relationships.get(entityId) || [];

    return rels.map((r) => ({
      relatedEntityId: r.targetId,
      relationshipType: r.type,
      riskFactor: r.riskAssociation,
    }));
  }

  /**
   * Get relationship graph for entity
   */
  async getGraph(entityId: string): Promise<RelationshipGraph | null> {
    return this.graphs.get(entityId) || null;
  }

  /**
   * Find suspicious relationships
   */
  async findSuspiciousRelationships(): Promise<EntityRelationship[]> {
    const suspicious: EntityRelationship[] = [];

    for (const [, relationships] of this.relationships) {
      for (const rel of relationships) {
        // High risk association or unusual strength/frequency
        if (
          rel.riskAssociation > 0.7 ||
          (rel.strength > 0.8 && rel.frequency > 50)
        ) {
          suspicious.push(rel);
        }
      }
    }

    return suspicious;
  }

  /**
   * Find connected components (groups of related entities)
   */
  async findClusters(): Promise<
    Array<{
      entityIds: string[];
      size: number;
      density: number;
      riskLevel: "low" | "medium" | "high";
    }>
  > {
    const visited = new Set<string>();
    const clusters: Array<{
      entityIds: string[];
      size: number;
      density: number;
      riskLevel: "low" | "medium" | "high";
    }> = [];

    for (const entityId of this.globalGraph.keys()) {
      if (!visited.has(entityId)) {
        const cluster = this.bfs(entityId, visited);
        if (cluster.length > 1) {
          const density = this.calculateClusterDensity(cluster);
          const avgRisk = this.calculateClusterRisk(cluster);

          let riskLevel: "low" | "medium" | "high" = "low";
          if (avgRisk > 0.7) {
            riskLevel = "high";
          } else if (avgRisk > 0.4) {
            riskLevel = "medium";
          }

          clusters.push({
            entityIds: cluster,
            size: cluster.length,
            density,
            riskLevel,
          });
        }
      }
    }

    return clusters;
  }

  /**
   * Get shortest path between entities
   */
  async getShortestPath(sourceId: string, targetId: string): Promise<string[]> {
    const queue = [[sourceId]];
    const visited = new Set<string>();
    visited.add(sourceId);

    while (queue.length > 0) {
      const path = queue.shift() || [];
      const current = path[path.length - 1];

      if (current === targetId) {
        return path;
      }

      const neighbors = this.globalGraph.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return []; // No path found
  }

  /**
   * Calculate network metrics
   */
  async getNetworkMetrics(): Promise<{
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    avgClusteringCoeff: number;
    diameter: number;
  }> {
    const totalNodes = this.globalGraph.size;
    let totalEdges = 0;
    let sumDegree = 0;

    for (const [, neighbors] of this.globalGraph) {
      totalEdges += neighbors.size;
      sumDegree += neighbors.size;
    }

    const avgDegree = sumDegree / Math.max(totalNodes, 1);

    // Simplified clustering coefficient
    let sumClusteringCoeff = 0;
    let clusterCount = 0;

    for (const [entityId, neighbors] of this.globalGraph) {
      const neighborArray = Array.from(neighbors);
      let triangles = 0;

      for (let i = 0; i < neighborArray.length; i++) {
        for (let j = i + 1; j < neighborArray.length; j++) {
          const neighborNeighbors = this.globalGraph.get(neighborArray[i]) || new Set();
          if (neighborNeighbors.has(neighborArray[j])) {
            triangles++;
          }
        }
      }

      const possibleTriangles =
        (neighborArray.length * (neighborArray.length - 1)) / 2;
      if (possibleTriangles > 0) {
        sumClusteringCoeff += triangles / possibleTriangles;
      }
      clusterCount++;
    }

    const avgClusteringCoeff =
      clusterCount > 0 ? sumClusteringCoeff / clusterCount : 0;

    // Estimate diameter (simplified)
    let maxDistance = 0;
    for (const startId of this.globalGraph.keys()) {
      for (const endId of this.globalGraph.keys()) {
        if (startId !== endId) {
          const path = this.bfs(startId, new Set());
          if (path.includes(endId)) {
            maxDistance = Math.max(maxDistance, path.indexOf(endId));
          }
        }
      }
    }

    return {
      totalNodes,
      totalEdges: totalEdges / 2, // Undirected edges counted twice
      avgDegree,
      avgClusteringCoeff,
      diameter: maxDistance,
    };
  }

  /**
   * Calculate graph metrics for an entity
   */
  private async calculateGraphMetrics(entityId: string): Promise<RelationshipGraph> {
    const relationships = this.relationships.get(entityId) || [];
    let riskFactor = 0;

    for (const rel of relationships) {
      riskFactor += rel.riskAssociation * rel.strength;
    }

    riskFactor = Math.min(1, riskFactor / Math.max(relationships.length, 1));

    const clusterSize = this.getClusterSize(entityId);
    const centralityScore = this.calculateCentrality(entityId);

    return {
      entityId,
      connections: relationships,
      riskFactor,
      clusterSize,
      centralityScore,
    };
  }

  /**
   * Infer relationship type
   */
  private inferRelationType(
    action: string
  ): EntityRelationship["type"] {
    const actionLower = action.toLowerCase();

    if (actionLower.includes("delegate") || actionLower.includes("assign")) {
      return "delegation";
    } else if (actionLower.includes("supervise") || actionLower.includes("manage")) {
      return "supervision";
    } else if (actionLower.includes("depend")) {
      return "dependency";
    }

    return "collaboration";
  }

  /**
   * Breadth-first search for finding clusters
   */
  private bfs(startId: string, visited: Set<string>): string[] {
    const queue = [startId];
    const cluster = [startId];
    visited.add(startId);

    let index = 0;
    while (index < queue.length) {
      const current = queue[index++];
      const neighbors = this.globalGraph.get(current) || new Set();

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
          cluster.push(neighbor);
        }
      }
    }

    return cluster;
  }

  /**
   * Calculate cluster density
   */
  private calculateClusterDensity(entityIds: string[]): number {
    if (entityIds.length < 2) return 0;

    let edges = 0;
    for (const entityId of entityIds) {
      const neighbors = this.globalGraph.get(entityId) || new Set();
      for (const neighbor of neighbors) {
        if (entityIds.includes(neighbor)) {
          edges++;
        }
      }
    }

    const maxEdges = (entityIds.length * (entityIds.length - 1)) / 2;
    return maxEdges > 0 ? edges / (2 * maxEdges) : 0;
  }

  /**
   * Calculate cluster risk
   */
  private calculateClusterRisk(entityIds: string[]): number {
    let totalRisk = 0;
    for (const entityId of entityIds) {
      const graph = this.graphs.get(entityId);
      if (graph) {
        totalRisk += graph.riskFactor;
      }
    }

    return totalRisk / Math.max(entityIds.length, 1);
  }

  /**
   * Get cluster size for entity
   */
  private getClusterSize(entityId: string): number {
    return this.bfs(entityId, new Set()).length;
  }

  /**
   * Calculate centrality (degree centrality)
   */
  private calculateCentrality(entityId: string): number {
    const neighbors = this.globalGraph.get(entityId)?.size || 0;
    const maxDegree = this.globalGraph.size - 1;

    return maxDegree > 0 ? neighbors / maxDegree : 0;
  }
}

export default RelationshipMapper;
