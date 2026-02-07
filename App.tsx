
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
import {
  clientService,
  projectService,
  phaseService,
  taskService,
  meetingService
} from './services/supabaseService';

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
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();

  // Carregar dados do Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [clientsData, projectsData, phasesData, tasksData, meetingsData] = await Promise.all([
          clientService.getAll(),
          projectService.getAll(),
          phaseService.getAll(),
          taskService.getAll(),
          meetingService.getAll()
        ]);
        
        setClients(clientsData);
        setProjects(projectsData);
        setPhases(phasesData);
        setTasks(tasksData);
        setMeetings(meetingsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const addClient = async (client: Omit<Client, 'id'>) => {
    const newClient = await clientService.create(client);
    if (newClient) {
      setClients(prev => [...prev, newClient]);
      return newClient;
    }
    return null;
  };

  const deleteClient = async (id: string) => {
    const success = await clientService.delete(id);
    if (success) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
    return success;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const updated = await clientService.update(id, updates);
    if (updated) {
      setClients(prev => prev.map(c => c.id === id ? updated : c));
    }
    return updated;
  };
  
  const addProject = async (project: Omit<Project, 'id'>) => {
    const newProject = await projectService.create(project);
    if (newProject) {
      setProjects(prev => [...prev, newProject]);
      return newProject;
    }
    return null;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updated = await projectService.update(id, updates);
    if (updated) {
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  };
  
  const addPhase = async (phase: Omit<Phase, 'id'>) => {
    const newPhase = await phaseService.create(phase);
    if (newPhase) {
      setPhases(prev => [...prev, newPhase]);
      return newPhase;
    }
    return null;
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    const newTask = await taskService.create(task);
    if (newTask) {
      setTasks(prev => [...prev, newTask]);
      return newTask;
    }
    return null;
  };

  const deleteTask = async (taskId: string) => {
    const success = await taskService.delete(taskId);
    if (success) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
    return success;
  };
  
  const updateTask = async (id: string, updates: Partial<Task>, observation?: string) => {
    const updated = await taskService.update(id, updates, observation);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
    return updated;
  };
  
  const addMeeting = async (meeting: Omit<Meeting, 'id'>) => {
    const newMeeting = await meetingService.create(meeting);
    if (newMeeting) {
      setMeetings(prev => [...prev, newMeeting]);
      return newMeeting;
    }
    return null;
  };

  const deleteMeeting = async (id: string) => {
    const success = await meetingService.delete(id);
    if (success) {
      setMeetings(prev => prev.filter(m => m.id !== id));
    }
    return success;
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    const updated = await meetingService.update(id, updates);
    if (updated) {
      setMeetings(prev => prev.map(m => m.id === id ? updated : m));
    }
    return updated;
  };

  const appState = {
    clients, setClients, addClient, deleteClient, updateClient,
    projects, setProjects, addProject, updateProject,
    phases, setPhases, addPhase,
    tasks, setTasks, addTask, deleteTask, updateTask,
    meetings, setMeetings, addMeeting, deleteMeeting, updateMeeting
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950 text-white items-center justify-center">
        <div className="text-center">
          <Zap className="animate-pulse mx-auto mb-4" size={48} />
          <p className="text-xl font-bold">Carregando dados...</p>
        </div>
      </div>
    );
  }

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
