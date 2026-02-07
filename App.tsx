
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  CheckSquare, 
  Plus, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Zap,
  Trash2,
  Video
} from 'lucide-react';
import { 
  Client, 
  Project, 
  Task, 
  Meeting, 
  Phase, 
  TaskStatus, 
  ProjectStatus, 
  PhaseStatus,
  ClientStatus,
  TaskPriority,
  MeetingStatus
} from './types';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ClientList from './components/ClientList';
import WeeklyView from './components/WeeklyView';
import MeetingList from './components/MeetingList';

// --- Context & Initial Data ---
const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'João Silva', company: 'Tech Solutions', email: 'joao@tech.com', phone: '11 99999-9999', status: ClientStatus.ACTIVE, observations: '' },
  { id: 'c2', name: 'Maria Souza', company: 'Design Pro', email: 'maria@design.com', phone: '11 88888-8888', status: ClientStatus.ACTIVE, observations: '' },
];

const INITIAL_PROJECTS: Project[] = [
  // Fix: Added missing 'files' property to satisfy the Project interface
  { id: 'p1', clientId: 'c1', name: 'Website E-commerce', description: 'Criação de nova loja virtual', value: 15000, startDate: '2024-05-01', dueDate: '2024-06-15', status: ProjectStatus.ACTIVE, files: [] },
];

const INITIAL_PHASES: Phase[] = [
  { id: 'f1', projectId: 'p1', name: 'Planejamento', order: 1, status: PhaseStatus.COMPLETED },
  { id: 'f2', projectId: 'p1', name: 'Desenvolvimento', order: 2, status: PhaseStatus.IN_PROGRESS },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', projectId: 'p1', phaseId: 'f1', title: 'Definição de Requisitos', description: '', status: TaskStatus.COMPLETED, startDate: '2024-05-01', startTime: '09:00', endDate: '2024-05-01', endTime: '12:00', estimatedHours: 3, priority: TaskPriority.HIGH, history: [{ status: TaskStatus.COMPLETED, observation: 'Initial completion', timestamp: new Date().toISOString() }] },
  { id: 't2', projectId: 'p1', phaseId: 'f2', title: 'Setup do Banco de Dados', description: '', status: TaskStatus.IN_PROGRESS, startDate: '2024-05-15', startTime: '10:00', endDate: '2024-05-15', endTime: '14:00', estimatedHours: 4, priority: TaskPriority.MEDIUM, history: [] },
];

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const AppContent = () => {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [phases, setPhases] = useState<Phase[]>(INITIAL_PHASES);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  
  const location = useLocation();

  const addClient = (client: Client) => setClients(prev => [...prev, client]);
  const deleteClient = (id: string) => setClients(prev => prev.filter(c => c.id !== id));
  const updateClient = (id: string, updates: Partial<Client>) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  
  const addProject = (project: Project) => setProjects(prev => [...prev, project]);
  const updateProject = (id: string, updates: Partial<Project>) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  
  const addPhase = (phase: Phase) => setPhases(prev => [...prev, phase]);
  const addTask = (task: Task) => setTasks(prev => [...prev, { ...task, history: task.history || [] }]);
  const deleteTask = (taskId: string) => setTasks(prev => prev.filter(t => t.id !== taskId));
  
  const updateTask = (id: string, updates: Partial<Task>, observation?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newHistory = [...(t.history || [])];
        if (updates.status && updates.status !== t.status) {
          newHistory.unshift({
            status: updates.status,
            observation: observation || 'Mudança de status sem observação detalhada',
            timestamp: new Date().toISOString()
          });
        }
        return { ...t, ...updates, history: newHistory };
      }
      return t;
    }));
  };
  
  const addMeeting = (meeting: Meeting) => setMeetings(prev => [...prev, meeting]);
  const deleteMeeting = (id: string) => setMeetings(prev => prev.filter(m => m.id !== id));
  const updateMeeting = (id: string, updates: Partial<Meeting>) => setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));

  const appState = {
    clients, setClients, addClient, deleteClient, updateClient,
    projects, setProjects, addProject, updateProject,
    phases, setPhases, addPhase,
    tasks, setTasks, addTask, deleteTask, updateTask,
    meetings, setMeetings, addMeeting, deleteMeeting, updateMeeting
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-gray-800 flex flex-col p-4">
        <div className="flex items-center space-x-2 px-2 mb-10">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight uppercase">AMORIM_SYS</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/weekly" icon={Calendar} label="Visão Semanal" active={location.pathname === '/weekly'} />
          <SidebarItem to="/projects" icon={Briefcase} label="Projetos" active={location.pathname.startsWith('/projects')} />
          <SidebarItem to="/meetings" icon={Video} label="Reuniões" active={location.pathname === '/meetings'} />
          <SidebarItem to="/clients" icon={Users} label="Clientes" active={location.pathname === '/clients'} />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center space-x-3 p-2">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">AS</div>
            <div>
              <p className="text-sm font-semibold">User Focus</p>
              <p className="text-xs text-gray-400">Plano Pro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 text-gray-900">
        <div className="p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard state={appState} />} />
            <Route path="/weekly" element={<WeeklyView state={appState} />} />
            <Route path="/projects" element={<ProjectList state={appState} />} />
            <Route path="/projects/:id" element={<ProjectDetail state={appState} />} />
            <Route path="/meetings" element={<MeetingList state={appState} />} />
            <Route path="/clients" element={<ClientList state={appState} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
