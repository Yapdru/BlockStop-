"use client";

import { useState } from "react";
import { Assignment, TeamMember } from "@/types/collaboration";

interface AssignmentEditorProps {
  assignments: Assignment[];
  teamMembers: TeamMember[];
  incidentId: string;
  onCreateAssignment?: (assignment: Omit<Assignment, "id">) => void;
  onUpdateAssignment?: (id: string, updates: Partial<Assignment>) => void;
}

export default function AssignmentEditor({
  assignments,
  teamMembers,
  incidentId,
  onCreateAssignment,
  onUpdateAssignment,
}: AssignmentEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium" as Assignment["priority"],
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  const statusColors = {
    pending: "bg-gray-100 text-gray-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.assignedTo) return;

    const newAssignment: Omit<Assignment, "id"> = {
      incidentId,
      taskId: `task_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      assignedTo: formData.assignedTo,
      assignedBy: "current_user",
      priority: formData.priority,
      dueDate: new Date(formData.dueDate),
      status: "pending",
      createdAt: new Date(),
    };

    if (onCreateAssignment) {
      onCreateAssignment(newAssignment);
    }

    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      priority: "medium",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg border border-light-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Task Assignments</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-semibold"
        >
          + New Task
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-light-surface rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              required
            />
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              required
            >
              <option value="">Select team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm mb-4"
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Assignment["priority"] })}
              className="px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-light-border rounded-lg hover:bg-light-surface text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-semibold"
            >
              Create Task
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <p>No assignments yet</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-start justify-between p-4 bg-light-surface rounded-lg border border-light-border hover:shadow-md transition"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[assignment.priority]}`}>
                    {assignment.priority.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[assignment.status]}`}>
                    {assignment.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-medium text-gray-900">
                  {teamMembers.find((m) => m.id === assignment.assignedTo)?.name || "Unassigned"}
                </p>
                <p className="text-xs text-gray-500">
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
