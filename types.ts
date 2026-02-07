
export enum ClientStatus {
  LEAD = 'lead',
  ACTIVE = 'ativo',
  PAUSED = 'pausado',
  FINISHED = 'finalizado'
}

export enum ProjectStatus {
  ACTIVE = 'ativo',
  PAUSED = 'pausado',
  COMPLETED = 'concluido'
}

export enum PhaseStatus {
  NOT_STARTED = 'nao iniciada',
  IN_PROGRESS = 'em andamento',
  COMPLETED = 'concluida'
}

export enum TaskStatus {
  PENDING = 'pendente',
  IN_PROGRESS = 'em andamento',
  BLOCKED = 'bloqueada',
  COMPLETED = 'concluida',
  PAUSED = 'pausada',
  WAITING_INFO = 'aguardando informacoes'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum MeetingStatus {
  SCHEDULED = 'agendada',
  HELD = 'realizada',
  CANCELLED = 'cancelada'
}

export interface TaskHistoryEntry {
  status: TaskStatus;
  observation: string;
  timestamp: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: ClientStatus;
  observations: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  value: number;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
  currentPhaseId?: string;
  files: ProjectFile[];
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  order: number;
  status: PhaseStatus;
}

export interface Task {
  id: string;
  projectId: string;
  phaseId: string;
  title: string;
  description: string;
  status: TaskStatus;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  estimatedHours: number;
  priority: TaskPriority;
  history?: TaskHistoryEntry[];
}

export interface Meeting {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  agenda: string;
  date: string;
  startTime: string;
  endTime: string;
  status: MeetingStatus;
  observations: string;
}
