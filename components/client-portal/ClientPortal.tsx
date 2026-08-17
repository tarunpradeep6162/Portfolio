"use client";

import { useState } from "react";
import {
  FileText,
  CheckCircle,
  Calendar,
  MessageSquare,
  Download,
  Upload,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed";
  progress: number;
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
}

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  completed: boolean;
  description: string;
}

interface Document {
  id: string;
  name: string;
  type: "proposal" | "contract" | "report" | "invoice" | "other";
  uploadedAt: string;
  size: string;
  url: string;
}

interface Message {
  id: string;
  from: string;
  subject: string;
  body: string;
  attachments: string[];
  timestamp: string;
  read: boolean;
}

export function ClientPortal() {
  const [activeTab, setActiveTab] = useState<
    "projects" | "documents" | "messages" | "invoices"
  >("projects");

  const [projects] = useState<Project[]>([
    {
      id: "proj-1",
      name: "Kubernetes Migration",
      description: "Complete migration to Kubernetes",
      status: "active",
      progress: 65,
      startDate: "2024-08-01",
      endDate: "2024-10-15",
      budget: 15000,
      spent: 9750,
    },
  ]);

  const [milestones] = useState<Milestone[]>([
    {
      id: "m1",
      name: "Architecture Design Complete",
      dueDate: "2024-08-15",
      completed: true,
      description: "Kubernetes architecture designed and approved",
    },
    {
      id: "m2",
      name: "Containerization",
      dueDate: "2024-09-01",
      completed: false,
      description: "All applications containerized",
    },
    {
      id: "m3",
      name: "Cluster Setup",
      dueDate: "2024-09-15",
      completed: false,
      description: "Production cluster deployed",
    },
  ]);

  const [documents] = useState<Document[]>([
    {
      id: "d1",
      name: "Kubernetes Architecture Proposal",
      type: "proposal",
      uploadedAt: "2024-08-01",
      size: "2.4 MB",
      url: "#",
    },
    {
      id: "d2",
      name: "Project Contract",
      type: "contract",
      uploadedAt: "2024-08-02",
      size: "1.2 MB",
      url: "#",
    },
    {
      id: "d3",
      name: "Week 1 Progress Report",
      type: "report",
      uploadedAt: "2024-08-08",
      size: "3.1 MB",
      url: "#",
    },
  ]);

  const [messages] = useState<Message[]>([
    {
      id: "msg1",
      from: "Tarun Pradeep",
      subject: "Architecture Design Review Meeting",
      body: "Let's schedule a meeting to review the Kubernetes architecture design this week.",
      attachments: [],
      timestamp: "2024-08-07",
      read: false,
    },
    {
      id: "msg2",
      from: "Support Team",
      subject: "Re: Infrastructure Questions",
      body: "Thanks for your questions. Here are the answers to your infrastructure concerns...",
      attachments: [],
      timestamp: "2024-08-06",
      read: true,
    },
  ]);

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-[var(--ink)] mb-2">
            Project Portal
          </h1>
          <p className="text-[var(--ink-muted)]">
            Track your project progress and collaborate with our team
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[var(--line)]">
          {[
            { id: "projects", label: "Projects" },
            { id: "documents", label: "Documents" },
            { id: "messages", label: "Messages" },
            { id: "invoices", label: "Invoices" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as typeof activeTab)
              }
              className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "text-[var(--accent)] border-[var(--accent)]"
                  : "text-[var(--ink-muted)] border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "projects" && (
            <div className="space-y-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
                        {project.name}
                      </h3>
                      <p className="text-sm text-[var(--ink-muted)] mt-1">
                        {project.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold capitalize ${
                        project.status === "active"
                          ? "bg-green-500/20 text-green-700"
                          : project.status === "completed"
                            ? "bg-blue-500/20 text-blue-700"
                            : "bg-yellow-500/20 text-yellow-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-[var(--ink-muted)]">
                        Progress
                      </span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[var(--surface)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-[var(--ink-muted)]">
                        Start Date
                      </p>
                      <p className="font-semibold text-[var(--ink)]">
                        {new Date(project.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--ink-muted)]">
                        End Date
                      </p>
                      <p className="font-semibold text-[var(--ink)]">
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString()
                          : "TBD"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--ink-muted)]">Budget</p>
                      <p className="font-semibold text-[var(--accent)]">
                        ${project.spent.toLocaleString()} / $
                        {project.budget.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h4 className="font-semibold text-[var(--ink)] mb-3">
                      Milestones
                    </h4>
                    <div className="space-y-2">
                      {milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded"
                        >
                          <CheckCircle
                            size={18}
                            className={
                              milestone.completed
                                ? "text-green-500"
                                : "text-[var(--ink-muted)]"
                            }
                          />
                          <div className="flex-1">
                            <p
                              className={
                                milestone.completed
                                  ? "line-through text-[var(--ink-muted)]"
                                  : "text-[var(--ink)]"
                              }
                            >
                              {milestone.name}
                            </p>
                            <p className="text-xs text-[var(--ink-muted)]">
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] hover:border-[var(--accent)]/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText
                      size={24}
                      className="text-[var(--accent)]"
                    />
                    <div>
                      <p className="font-semibold text-[var(--ink)]">
                        {doc.name}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {doc.uploadedAt} • {doc.size}
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 rounded bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all">
                    <Download size={16} />
                    Download
                  </button>
                </div>
              ))}

              <div className="p-8 rounded-lg border-2 border-dashed border-[var(--line)] text-center">
                <Upload size={32} className="mx-auto text-[var(--accent)] mb-3" />
                <p className="text-[var(--ink)]">Drag and drop files here</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  or click to browse
                </p>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg border ${
                    msg.read
                      ? "border-[var(--line)] bg-[var(--color-control-raised)]"
                      : "border-[var(--accent)] bg-[var(--accent)]/5"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">
                        {msg.from}
                      </p>
                      <p className="text-sm text-[var(--ink-muted)]">
                        {msg.subject}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {msg.timestamp}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--ink)] leading-6">
                    {msg.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="text-center py-12">
              <p className="text-[var(--ink-muted)]">
                No invoices yet. Invoices will appear here once project is
                billed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
