
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus,
  Zap,
  Target,
  Users,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Trash2,
  History,
  MessageSquare,
  Info,
  FileText,
  Upload,
  Download,
  FileCode,
  Image as ImageIcon,
  File as FileIcon,
  Eye,
  FileEdit,
  Music,
  PlayCircle
} from 'lucide-react';
import { Project, Task, Phase, TaskStatus, PhaseStatus, TaskPriority, ProjectFile } from '../types';
import { geminiService } from '../services/geminiService';
import mammoth from 'mammoth';
import { Document, Page, pdfjs } from 'react-pdf';
import ReactAudioPlayer from 'react-audio-player';

// Configuração do Worker do PDF.js para o react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ProjectDetail = ({ state }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, phases, tasks, clients, setPhases, setTasks, addPhase, addTask, deleteTask, updateTask, updateProject } = state;

  const [activeTab, setActiveTab] = useState<'geral' | 'tasks' | 'arquivos'>('geral');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState<TaskStatus>(TaskStatus.COMPLETED);
  const [observation, setObservation] = useState('');

  const [newPhaseName, setNewPhaseName] = useState('');
  const [newTask, setNewTask] = useState({ 
    title: '', 
    estimatedHours: 1, 
    priority: TaskPriority.MEDIUM, 
    startTime: '09:00', 
    endTime: '10:00', 
    startDate: new Date().toISOString().split('T')[0] 
  });
  
  // File Preview State
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [docxContent, setDocxContent] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);

  const project = projects.find((p: Project) => p.id === id);
  const client = clients.find((c: any) => c.id === project?.clientId);
  const projectPhases = phases.filter((f: Phase) => f.projectId === id).sort((a: any, b: any) => a.order - b.order);
  const projectTasks = tasks.filter((t: Task) => t.projectId === id);

  const base64ToBlobUrl = (base64: string, type: string) => {
    try {
      const byteCharacters = atob(base64.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Failed to convert base64 to Blob:", e);
      return '';
    }
  };

  useEffect(() => {
    if (previewFile) {
      const url = base64ToBlobUrl(previewFile.url, previewFile.type);
      setPreviewUrl(url);

      if (previewFile.name.toLowerCase().endsWith('.docx') || previewFile.type.includes('officedocument.wordprocessingml.document')) {
        const base64Data = previewFile.url.split(',')[1];
        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        mammoth.convertToHtml({ arrayBuffer: bytes.buffer })
          .then((result) => setDocxContent(result.value))
          .catch((err) => {
            console.error("Error converting docx:", err);
            setDocxContent("<div class='p-10 text-center'><p class='text-rose-500 font-bold'>Erro ao processar o documento Word.</p></div>");
          });
      }

      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl('');
      setDocxContent('');
      setNumPages(0);
    }
  }, [previewFile]);

  if (!project) return <div className="p-20 text-center font-bold text-gray-900">Projeto não encontrado</div>;

  const progress = useMemo(() => {
    if (!projectTasks.length) return 0;
    const completed = projectTasks.filter((t: Task) => t.status === TaskStatus.COMPLETED).length;
    return Math.round((completed / projectTasks.length) * 100);
  }, [projectTasks]);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    const plan = await geminiService.suggestProjectPlan(project.name, project.description);
    if (plan && plan.phases) {
      const newPhases: Phase[] = [];
      const newTasks: Task[] = [];
      
      plan.phases.forEach((p: any, idx: number) => {
        const phaseId = `f-gen-${Date.now()}-${idx}`;
        newPhases.push({
          id: phaseId,
          projectId: project.id,
          name: p.name,
          order: projectPhases.length + idx + 1,
          status: PhaseStatus.NOT_STARTED
        });

        p.tasks.forEach((t: any, tidx: number) => {
          newTasks.push({
            id: `t-gen-${Date.now()}-${idx}-${tidx}`,
            projectId: project.id,
            phaseId: phaseId,
            title: t.title,
            description: '',
            status: TaskStatus.PENDING, 
            startDate: project.startDate,
            startTime: '09:00',
            endDate: project.dueDate,
            endTime: '10:00',
            estimatedHours: t.estimatedHours || 1,
            priority: TaskPriority.MEDIUM,
            history: []
          });
        });
      });

      setPhases([...phases, ...newPhases]);
      setTasks([...tasks, ...newTasks]);
    }
    setIsGenerating(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newFile: ProjectFile = {
          id: `file-${Date.now()}`,
          name: file.name,
          url: base64,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
        updateProject(project.id, {
          files: [...(project.files || []), newFile]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteFile = (fileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Deseja realmente excluir este arquivo? Esta ação é irreversível.')) {
      // Fecha o preview antes de excluir se for o arquivo atual
      if (previewFile?.id === fileId) {
        setPreviewFile(null);
      }
      
      const currentFiles = project.files || [];
      const updatedFiles = currentFiles.filter((f: ProjectFile) => f.id !== fileId);
      
      updateProject(project.id, {
        files: updatedFiles
      });
    }
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.includes('image')) return <ImageIcon className="text-pink-500" size={24} />;
    if (type.includes('pdf')) return <FileText className="text-rose-500" size={24} />;
    if (type.includes('audio')) return <Music className="text-amber-500" size={24} />;
    if (name.toLowerCase().endsWith('.docx') || type.includes('officedocument.wordprocessingml.document')) return <FileEdit className="text-blue-500" size={24} />;
    if (type.includes('code') || type.includes('json')) return <FileCode className="text-indigo-500" size={24} />;
    return <FileIcon className="text-gray-400" size={24} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getPhaseProgress = (phaseId: string) => {
    const pTasks = projectTasks.filter((t: Task) => t.phaseId === phaseId);
    if (!pTasks.length) return 0;
    const completed = pTasks.filter((t: Task) => t.status === TaskStatus.COMPLETED).length;
    return Math.round((completed / pTasks.length) * 100);
  };

  const handleAddPhase = (e: React.FormEvent) => {
    e.preventDefault();
    const phase: Phase = {
      id: `f-${Date.now()}`,
      projectId: project.id,
      name: newPhaseName,
      order: projectPhases.length + 1,
      status: PhaseStatus.NOT_STARTED
    };
    addPhase(phase);
    setNewPhaseName('');
    setIsPhaseModalOpen(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const task: Task = {
      ...newTask,
      id: `t-${Date.now()}`,
      projectId: project.id,
      phaseId: selectedPhaseId,
      status: TaskStatus.PENDING,
      description: '',
      endDate: newTask.startDate,
      history: []
    };
    addTask(task);
    setIsTaskModalOpen(false);
    setNewTask({ title: '', estimatedHours: 1, priority: TaskPriority.MEDIUM, startTime: '09:00', endTime: '10:00', startDate: new Date().toISOString().split('T')[0] });
  };

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTaskDetail && observation.trim()) {
      updateTask(selectedTaskDetail.id, { status: newStatus }, observation);
      setObservation('');
      setSelectedTaskDetail(null);
    }
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTask(taskId);
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
    <div className="space-y-8 pb-20 relative text-gray-900">
      <button 
        onClick={() => navigate('/projects')}
        className="flex items-center space-x-2 text-gray-500 hover:text-indigo-600 transition-colors font-semibold"
      >
        <ChevronLeft size={20} />
        <span>Voltar para Projetos</span>
      </button>

      {/* Project Header */}
      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <h1 className="text-4xl font-black tracking-tight">{project.name}</h1>
              <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                {project.status}
              </span>
            </div>
            <p className="text-xl text-gray-500 max-w-2xl font-medium leading-relaxed">{project.description}</p>
          </div>
          <div className="flex flex-col items-end gap-3 min-w-[280px]">
            <div className="flex items-center space-x-3 text-sm font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
              <Users size={18} className="text-indigo-500" />
              <span>Cliente: <span className="text-gray-900">{client?.company}</span></span>
            </div>
            <div className="flex items-center space-x-3 text-sm font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
              <Calendar size={18} className="text-rose-500" />
              <span>Prazo Final: <span className="text-gray-900">{new Date(project.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span></span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex border-b border-gray-100">
          <button onClick={() => setActiveTab('geral')} className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'geral' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            Geral {activeTab === 'geral' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'tasks' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            Tasks {activeTab === 'tasks' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
          </button>
          <button onClick={() => setActiveTab('arquivos')} className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'arquivos' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            Arquivos {activeTab === 'arquivos' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
          </button>
        </div>
      </div>

      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-3xl flex items-center space-x-5 shadow-sm border border-gray-100">
                <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600"><Target size={28} /></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Progresso Geral</p><p className="text-3xl font-black">{progress}%</p></div>
              </div>
              <div className="p-6 bg-white rounded-3xl flex items-center space-x-5 shadow-sm border border-gray-100">
                <div className="p-4 bg-emerald-50 rounded-xl text-emerald-500"><Layers size={28} /></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total de Fases</p><p className="text-3xl font-black">{projectPhases.length}</p></div>
              </div>
              <div className="p-6 bg-white rounded-3xl flex items-center space-x-5 shadow-sm border border-gray-100">
                <div className="p-4 bg-amber-50 rounded-xl text-amber-500"><CheckCircle2 size={28} /></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total de Tasks</p><p className="text-3xl font-black">{projectTasks.length}</p></div>
              </div>
              <div className="p-6 bg-white rounded-3xl flex items-center space-x-5 shadow-sm border border-gray-100">
                <div className="p-4 bg-rose-50 rounded-xl text-rose-500"><Clock size={28} /></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Carga Horária</p><p className="text-3xl font-black">{projectTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0)}h</p></div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black mb-6 flex items-center space-x-3 uppercase tracking-tight"><Info className="text-indigo-600" size={24} /><span>Sobre o Projeto</span></h3>
              <p className="text-gray-600 leading-relaxed font-medium">{project.description || "Nenhuma descrição detalhada fornecida para este projeto."}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-fit sticky top-8">
              <h3 className="text-lg font-black mb-8 flex items-center space-x-3"><Zap className="text-indigo-600" size={24} /><span className="uppercase tracking-tight">Próximos Passos</span></h3>
              <div className="space-y-6">
                {projectTasks.filter((t: Task) => t.status !== TaskStatus.COMPLETED).length > 0 ? (
                  projectTasks.filter((t: Task) => t.status !== TaskStatus.COMPLETED).slice(0, 5).map((t: Task) => (
                    <div key={t.id} className="flex items-start space-x-4 group cursor-pointer" onClick={() => { setSelectedTaskDetail(t); setNewStatus(t.status); }}>
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-50 transition-all group-hover:scale-125" />
                      <div>
                        <p className="text-sm font-black text-gray-800 group-hover:text-indigo-600 transition-colors">{t.title}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase mt-1">{phases.find((f: any) => f.id === t.phaseId)?.name}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-emerald-600 font-black bg-emerald-50/50 rounded-3xl flex flex-col items-center border border-emerald-100">
                    <CheckCircle2 size={48} className="mb-4" /><span className="uppercase tracking-widest text-xs">Projeto Finalizado!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Roteiro de Entrega</h2>
            <div className="flex space-x-3">
              <button onClick={handleGeneratePlan} disabled={isGenerating} className="flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition-all disabled:opacity-50 shadow-sm">
                {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}<span>Sugerir IA</span>
              </button>
              <button onClick={() => setIsPhaseModalOpen(true)} className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-xl hover:bg-gray-800 transition-all">
                <Plus size={16} /><span>Nova Fase</span>
              </button>
            </div>
          </div>
          <div className="space-y-6">
            {projectPhases.map((phase: Phase) => {
              const phaseTasks = projectTasks.filter((t: Task) => t.phaseId === phase.id);
              const pProgress = getPhaseProgress(phase.id);
              return (
                <div key={phase.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-100">{phase.order}</div>
                      <h3 className="text-lg font-black">{phase.name}</h3>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-3"><span className="text-[10px] font-black text-gray-400 uppercase">{pProgress}%</span><div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pProgress}%` }} /></div></div>
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${phase.status === PhaseStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : phase.status === PhaseStatus.IN_PROGRESS ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{phase.status}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {phaseTasks.map((task: Task) => (
                      <div key={task.id} onClick={() => { setSelectedTaskDetail(task); setNewStatus(task.status); }} className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-all group cursor-pointer border-l-4 border-transparent hover:border-indigo-500">
                        <div className="flex items-center space-x-5">
                          <div className={`p-1.5 rounded-full transition-colors ${task.status === TaskStatus.COMPLETED ? 'text-emerald-500' : task.status === TaskStatus.PAUSED ? 'text-amber-500' : task.status === TaskStatus.WAITING_INFO ? 'text-orange-500' : 'text-gray-300'}`}>{task.status === TaskStatus.COMPLETED ? <CheckCircle2 size={24} /> : <Circle size={24} />}</div>
                          <div>
                            <h4 className={`text-base font-bold transition-all ${task.status === TaskStatus.COMPLETED ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</h4>
                            <div className="flex items-center space-x-4 mt-1.5"><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${task.status === TaskStatus.PAUSED ? 'bg-amber-100 text-amber-700' : task.status === TaskStatus.WAITING_INFO ? 'bg-orange-100 text-orange-700' : task.status === TaskStatus.PENDING ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>{getStatusLabel(task.status)}</span><span className="text-[10px] flex items-center space-x-1.5 text-gray-400 font-black uppercase"><Clock size={12} className="text-gray-300" /><span>{task.estimatedHours}h Planejadas</span></span></div>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-3 transition-opacity"><span className="text-[10px] font-black text-indigo-500 uppercase">Ver detalhes</span><button onClick={(e) => handleDeleteTask(task.id, e)} className="p-2.5 text-gray-300 hover:text-rose-600 bg-white rounded-xl shadow-sm hover:shadow transition-all"><Trash2 size={16} /></button></div>
                      </div>
                    ))}
                    <button onClick={(e) => { e.stopPropagation(); setSelectedPhaseId(phase.id); setIsTaskModalOpen(true); }} className="w-full p-5 text-sm font-black text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center space-x-2 border-t border-gray-100 uppercase tracking-widest"><Plus size={18} /><span>Adicionar Tarefa</span></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'arquivos' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Documentação e Anexos</h2>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-xl hover:bg-indigo-700 transition-all"><Upload size={20} /><span>Subir Novo Arquivo</span><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.files && project.files.length > 0 ? (
              project.files.map((file: ProjectFile) => (
                <div key={file.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow group relative overflow-hidden">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-gray-50 rounded-2xl">{getFileIcon(file.type, file.name)}</div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => setPreviewFile(file)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors" title="Visualizar"><Eye size={18} /></button>
                      <a href={file.url} download={file.name} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors" title="Baixar"><Download size={18} /></a>
                      <button 
                        type="button"
                        onClick={(e) => deleteFile(file.id, e)} 
                        className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" 
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div onClick={() => setPreviewFile(file)} className="flex-1 cursor-pointer group-hover:opacity-80 transition-opacity">
                    <h4 className="text-gray-900 font-bold text-sm truncate mb-1" title={file.name}>{file.name}</h4>
                    <div className="flex items-center justify-between"><span className="text-[10px] text-gray-400 font-black uppercase">{formatFileSize(file.size)}</span><span className="text-[10px] text-gray-400 font-black uppercase">{new Date(file.uploadedAt).toLocaleDateString('pt-BR')}</span></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400"><FileIcon size={64} strokeWidth={1} className="mb-4 opacity-20" /><p className="text-lg font-bold">Nenhum documento anexado.</p></div>
            )}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 left-0 lg:left-64 bg-black/80 backdrop-blur-md z-[60] flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex justify-between items-center text-white border-b border-white/10">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/10 rounded-xl">{getFileIcon(previewFile.type, previewFile.name)}</div>
              <div><h3 className="font-bold truncate max-w-md">{previewFile.name}</h3><p className="text-[10px] uppercase font-black opacity-60 tracking-widest">{formatFileSize(previewFile.size)} • {previewFile.type}</p></div>
            </div>
            <div className="flex items-center space-x-3">
              <a href={previewUrl} download={previewFile.name} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors flex items-center space-x-2"><Download size={20} /><span className="text-xs font-bold uppercase">Baixar</span></a>
              <button onClick={() => setPreviewFile(null)} className="p-3 bg-white text-black rounded-2xl font-bold transition-transform active:scale-95 flex items-center space-x-2"><X size={20} /><span className="text-xs font-bold uppercase">Fechar</span></button>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-black/20">
            {previewFile.type.includes('image') ? (
              <div className="w-full h-full flex items-center justify-center">
                <img src={previewUrl} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in duration-500" />
              </div>
            ) : previewFile.type.includes('pdf') ? (
              <div className="w-full max-w-4xl bg-white/5 p-8 rounded-3xl overflow-y-auto shadow-2xl">
                <Document
                  file={previewUrl}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<div className="text-white font-black animate-pulse flex flex-col items-center"><RefreshCw className="animate-spin mb-4" size={48} /><span>CARREGANDO DOCUMENTO...</span></div>}
                  error={<div className="text-rose-400 font-bold p-10 bg-white/10 rounded-3xl border border-rose-500/20 text-center">Não foi possível processar este PDF.<br/>Tente baixar para visualizá-lo.</div>}
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page 
                      key={`page_${index + 1}`} 
                      pageNumber={index + 1} 
                      scale={1.5}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="mb-8"
                    />
                  ))}
                </Document>
              </div>
            ) : previewFile.type.includes('audio') ? (
              <div className="w-full max-w-lg bg-white p-12 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-8 duration-500 flex flex-col items-center space-y-8">
                <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 shadow-inner">
                  <Music size={48} />
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-black text-gray-900 truncate max-w-xs">{previewFile.name}</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase mt-1">Arquivo de Áudio • {formatFileSize(previewFile.size)}</p>
                </div>
                <div className="w-full audio-player-container">
                  <ReactAudioPlayer
                    src={previewUrl}
                    controls
                    autoPlay
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  <PlayCircle size={16} />
                  <span>Tocando Agora</span>
                </div>
              </div>
            ) : (previewFile.name.toLowerCase().endsWith('.docx') || previewFile.type.includes('officedocument.wordprocessingml.document')) ? (
              <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-y-auto p-12 animate-in slide-in-from-bottom-8 duration-500 prose max-w-4xl prose-indigo">
                <div dangerouslySetInnerHTML={{ __html: docxContent }} />
              </div>
            ) : (
              <div className="text-center text-white my-auto">
                <FileIcon size={80} className="mx-auto mb-6 opacity-40" /><p className="text-xl font-bold mb-2">Visualização não disponível</p>
                <a href={previewUrl} download={previewFile.name} className="inline-flex items-center space-x-3 bg-indigo-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40 mt-6"><Download size={20} /><span>Baixar Arquivo</span></a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 left-0 lg:left-64 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 text-gray-900">
              <div className="flex items-center space-x-4"><div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><Info size={24} /></div><div><h2 className="text-2xl font-black tracking-tight leading-tight">{selectedTaskDetail.title}</h2><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Status e Evolução da Atividade</p></div></div>
              <button onClick={() => setSelectedTaskDetail(null)} className="p-2 text-gray-400 hover:text-rose-600 bg-white border border-gray-100 rounded-2xl transition-all shadow-sm active:scale-95"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-5 h-full">
              <div className="md:col-span-2 p-10 border-r border-gray-50 space-y-8 text-gray-900">
                <form onSubmit={handleStatusUpdate} className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Atualizar Situação</h3>
                  <div className="space-y-5">
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Novo Status:</label><select value={newStatus} onChange={e => setNewStatus(e.target.value as TaskStatus)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold"><option value={TaskStatus.PENDING}>Pendente</option><option value={TaskStatus.IN_PROGRESS}>Em Andamento</option><option value={TaskStatus.COMPLETED}>Concluída</option><option value={TaskStatus.PAUSED}>Pausada</option><option value={TaskStatus.WAITING_INFO}>Aguardando Informações</option><option value={TaskStatus.BLOCKED}>Bloqueada</option></select></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Observação Detalhada:</label><textarea required rows={5} value={observation} onChange={e => setObservation(e.target.value)} placeholder="Relate o progresso..." className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm leading-relaxed" /></div>
                    <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-3 active:scale-[0.98]"><MessageSquare size={18} /><span>Registrar</span></button>
                  </div>
                </form>
              </div>
              <div className="md:col-span-3 p-10 bg-gray-50/30 flex flex-col">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center space-x-3 mb-10"><History size={16} /><span>Histórico</span></h3>
                <div className="flex-1 space-y-8 text-gray-900">
                  {(selectedTaskDetail.history && selectedTaskDetail.history.length > 0) ? (
                    selectedTaskDetail.history.map((entry, idx) => (
                      <div key={idx} className="relative pl-10 pb-8 border-l-2 border-indigo-100 last:border-0"><div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-indigo-600 shadow-sm" /><div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all"><div className="flex justify-between items-start mb-4"><span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${entry.status === TaskStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : entry.status === TaskStatus.PAUSED ? 'bg-amber-100 text-amber-700' : entry.status === TaskStatus.WAITING_INFO ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>{getStatusLabel(entry.status)}</span><span className="text-[10px] text-gray-400 font-black flex items-center space-x-1.5"><Calendar size={12} /><span>{new Date(entry.timestamp).toLocaleString('pt-BR')}</span></span></div><p className="text-sm text-gray-700 leading-relaxed font-medium italic">"{entry.observation}"</p></div></div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10"><MessageSquare size={64} className="mb-6 opacity-20" /><p className="font-black uppercase text-xs tracking-[0.2em]">Sem histórico</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modals */}
      {isPhaseModalOpen && (
        <div className="fixed inset-0 left-0 lg:left-64 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 text-gray-900 font-black"><h2 className="text-xl">Adicionar Fase</h2><button onClick={() => setIsPhaseModalOpen(false)} className="text-gray-400 hover:text-gray-600 active:scale-90"><X /></button></div>
            <form onSubmit={handleAddPhase} className="p-8 space-y-6"><div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nome do Estágio</label><input required type="text" value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold" placeholder="Ex: Criação do Protótipo" /></div><button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Definir Fase</button></form>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="fixed inset-0 left-0 lg:left-64 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 text-gray-900 font-black"><h2 className="text-xl">Planejar Nova Task</h2><button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600 active:scale-90"><X /></button></div>
            <form onSubmit={handleAddTask} className="p-8 space-y-5">
              <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">O que será feito?</label><input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold" placeholder="Título da tarefa..." /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Horas Est.</label><input type="number" value={newTask.estimatedHours} onChange={e => setNewTask({...newTask, estimatedHours: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold" /></div><div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Prioridade</label><select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold"><option value={TaskPriority.LOW}>Baixa</option><option value={TaskPriority.MEDIUM}>Média</option><option value={TaskPriority.HIGH}>Alta</option></select></div></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data de Execução</label><input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask, startDate: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Hora Início</label><input type="time" value={newTask.startTime} onChange={e => setNewTask({...newTask, startTime: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold" /></div><div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Hora Fim</label><input type="time" value={newTask.endTime} onChange={e => setNewTask({...newTask, endTime: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold" /></div></div>
              <div className="bg-blue-50 p-4 rounded-xl flex items-center space-x-3 border border-blue-100"><Info size={16} className="text-blue-500" /><p className="text-[10px] text-blue-700 font-black uppercase tracking-tight">Tarefa iniciada como "Pendente".</p></div>
              <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">Planejar Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
