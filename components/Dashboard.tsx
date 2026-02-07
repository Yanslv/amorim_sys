
import React, { useMemo, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  ArrowUpRight,
  Target,
  X,
  MessageSquare,
  History,
  Info
} from 'lucide-react';
import { TaskStatus, ProjectStatus, Task } from '../types';

const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
      {subValue && <p className="text-sm text-gray-400 mt-1">{subValue}</p>}
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="text-white" size={24} />
    </div>
  </div>
);

const Dashboard = ({ state }: any) => {
  const { tasks, projects, clients, meetings, updateTask } = state;
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState<TaskStatus>(TaskStatus.COMPLETED);
  const [observation, setObservation] = useState('');

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter((t: any) => t.startDate === today);
    const completedTasks = tasks.filter((t: any) => t.status === TaskStatus.COMPLETED);
    const activeProjects = projects.filter((p: any) => p.status === ProjectStatus.ACTIVE);
    const todayStr = new Date().toISOString().split('T')[0];
    const delayedTasksCount = tasks.filter((t: any) => t.status !== TaskStatus.COMPLETED && t.endDate < todayStr).length;

    const hoursPlanned = tasks.reduce((acc: number, t: any) => acc + (t.estimatedHours || 0), 0);
    const hoursExecuted = tasks.filter((t: any) => t.status === TaskStatus.COMPLETED)
                               .reduce((acc: number, t: any) => acc + (t.estimatedHours || 0), 0);

    return {
      todayTasksCount: todayTasks.length,
      completionRate: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      activeProjectsCount: activeProjects.length,
      delayedTasksCount,
      hoursPlanned,
      hoursExecuted
    };
  }, [tasks, projects]);

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTaskDetail && observation.trim()) {
      updateTask(selectedTaskDetail.id, { status: newStatus }, observation);
      setSelectedTaskDetail(null);
      setObservation('');
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING: return 'Pendente';
      case TaskStatus.IN_PROGRESS: return 'Em Andamento';
      case TaskStatus.COMPLETED: return 'Concluída';
      case TaskStatus.PAUSED: return 'Pausada';
      case TaskStatus.WAITING_INFO: return 'Aguardando Informações';
      case TaskStatus.BLOCKED: return 'Bloqueada';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 relative">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-2 font-medium">Bem-vindo de volta! Priorize suas ações imediatas.</p>
        </div>
        <div className="flex space-x-3">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center space-x-2">
            <CalendarIcon size={16} className="text-gray-400" />
            <span className="text-sm font-semibold">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-gray-900">
          <h3 className="text-xl font-bold mb-6">Executar Agora</h3>
          <div className="space-y-4">
            {tasks.filter((t: any) => 
              t.status === TaskStatus.PENDING || 
              t.status === TaskStatus.IN_PROGRESS || 
              t.status === TaskStatus.WAITING_INFO
            ).slice(0, 5).map((task: any) => {
              const project = projects.find((p: any) => p.id === task.projectId);
              const client = clients.find((c: any) => c.id === project?.clientId);
              
              return (
                <div 
                  key={task.id} 
                  onClick={() => { setSelectedTaskDetail(task); setNewStatus(task.status); }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer border border-transparent hover:border-indigo-100"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${task.priority === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{task.title}</h4>
                      <div className="flex flex-col space-y-0.5 mt-0.5">
                        <p className="text-[10px] font-black uppercase text-indigo-600">
                          {project?.name} <span className="text-gray-300 mx-1">|</span> {client?.company || client?.name || 'Cliente Externo'}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            task.status === TaskStatus.WAITING_INFO ? 'bg-orange-100 text-orange-700' : 
                            task.status === TaskStatus.PENDING ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {getStatusLabel(task.status)}
                          </span>
                          <p className="text-[10px] font-medium text-gray-400">
                            {task.startTime} - {task.endTime} • {task.estimatedHours}h
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Ver detalhes</span>
                    <ArrowUpRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" size={18} />
                  </div>
                </div>
              );
            })}
            {tasks.filter((t: any) => 
              t.status === TaskStatus.PENDING || 
              t.status === TaskStatus.IN_PROGRESS || 
              t.status === TaskStatus.WAITING_INFO
            ).length === 0 && <p className="text-center text-gray-400 py-10 font-bold">🎉 Nenhuma tarefa prioritária pendente!</p>}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-gray-900">
          <h3 className="text-xl font-bold mb-6">Próximas Reuniões</h3>
          <div className="space-y-4">
            {meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <CalendarIcon size={40} strokeWidth={1} className="mb-2" />
                <p>Nenhuma reunião agendada</p>
              </div>
            ) : (
              meetings.map((m: any) => (
                <div key={m.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl">
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg flex flex-col items-center justify-center min-w-[60px]">
                    <span className="text-xs font-bold uppercase">{new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    <span className="text-xl font-black">{new Date(m.date + 'T00:00:00').getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{m.title}</h4>
                    <p className="text-sm text-gray-500">{m.startTime}h - {m.endTime}h</p>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase mt-1">
                      {projects.find((p: any) => p.id === m.projectId)?.name || 'Sem Projeto'}
                    </p>
                  </div>
                  <ArrowUpRight className="text-gray-300" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tasks Hoje" value={stats.todayTasksCount} icon={CheckCircle2} color="bg-indigo-600" subValue={`${stats.completionRate}% de taxa total`} />
        <StatCard title="Projetos Ativos" value={stats.activeProjectsCount} icon={Target} color="bg-emerald-500" subValue="Em andamento" />
        <StatCard title="Horas Planejadas" value={`${stats.hoursPlanned}h`} icon={Clock} color="bg-amber-500" subValue={`${stats.hoursExecuted}h já executadas`} />
        <StatCard title="Atrasos" value={stats.delayedTasksCount} icon={AlertTriangle} color="bg-rose-500" subValue="Requer atenção imediata" />
      </div>

      {/* Task Detail & History Modal - Fixed with left margin to not cover sidebar */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 left-0 lg:left-64 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 text-gray-900">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Info size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black leading-none">{selectedTaskDetail.title}</h2>
                  <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">Painel de Execução e Histórico</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTaskDetail(null)} 
                className="p-2 text-gray-400 hover:text-rose-600 bg-white border border-gray-100 rounded-xl transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-5 h-full">
              {/* Status Update Column */}
              <div className="md:col-span-2 p-8 border-r border-gray-100 space-y-6 bg-white">
                <form onSubmit={handleStatusUpdate} className="space-y-6">
                  <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider">Ações Imediatas</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Mudar Status para:</label>
                      <select 
                        value={newStatus} 
                        onChange={e => setNewStatus(e.target.value as TaskStatus)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold appearance-none cursor-pointer"
                      >
                        <option value={TaskStatus.PENDING}>Pendente</option>
                        <option value={TaskStatus.IN_PROGRESS}>Em Andamento</option>
                        <option value={TaskStatus.COMPLETED}>Concluída</option>
                        <option value={TaskStatus.PAUSED}>Pausada</option>
                        <option value={TaskStatus.WAITING_INFO}>Aguardando Informações</option>
                        <option value={TaskStatus.BLOCKED}>Bloqueada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Observação da Etapa:</label>
                      <textarea 
                        required
                        rows={5}
                        value={observation}
                        onChange={e => setObservation(e.target.value)}
                        placeholder="Descreva o que foi feito ou o motivo da mudança de status..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm leading-relaxed"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-3 transform active:scale-[0.98]"
                    >
                      <MessageSquare size={18} />
                      <span>Registrar Progresso</span>
                    </button>
                  </div>
                </form>

                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider mb-4">Dados da Tarefa</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Projeto Relacionado</p>
                      <p className="font-bold text-indigo-600 text-sm">{projects.find((p: any) => p.id === selectedTaskDetail.projectId)?.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Carga Horária</p>
                        <p className="font-bold text-gray-900 text-sm">{selectedTaskDetail.estimatedHours}h Planejadas</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Prioridade</p>
                        <p className={`font-black uppercase text-[10px] mt-1 ${selectedTaskDetail.priority === 'high' ? 'text-rose-600' : 'text-blue-600'}`}>
                          {selectedTaskDetail.priority}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Timeline Column */}
              <div className="md:col-span-3 p-8 bg-gray-50 flex flex-col">
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider flex items-center space-x-2 mb-8">
                  <History size={16} />
                  <span>Timeline de Execução</span>
                </h3>
                <div className="flex-1 space-y-6">
                  {(selectedTaskDetail.history && selectedTaskDetail.history.length > 0) ? (
                    selectedTaskDetail.history.map((entry, idx) => (
                      <div key={idx} className="relative pl-8 pb-6 border-l-2 border-indigo-100 last:border-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                              entry.status === TaskStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                              entry.status === TaskStatus.PAUSED ? 'bg-amber-100 text-amber-700' : 
                              entry.status === TaskStatus.WAITING_INFO ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {getStatusLabel(entry.status)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold flex items-center space-x-1">
                              <Clock size={12} />
                              <span>{new Date(entry.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">"{entry.observation}"</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
                      <MessageSquare size={48} className="mb-4 opacity-20" />
                      <p className="font-black uppercase text-xs tracking-widest">Nenhuma observação registrada</p>
                      <p className="text-[10px] mt-1 font-bold">Inicie a execução e registre seu progresso.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
