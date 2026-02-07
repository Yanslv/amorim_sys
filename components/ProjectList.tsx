
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectFileService } from '../services/supabaseService';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Calendar, 
  Target, 
  Activity,
  Layers,
  ArrowRight,
  X,
  Upload,
  FileText
} from 'lucide-react';
import { ProjectStatus, Project, ProjectFile } from '../types';

const ProjectList = ({ state }: any) => {
  const { projects, clients, phases, tasks, addProject } = state;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [newProject, setNewProject] = useState({
    name: '',
    clientId: clients[0]?.id || '',
    description: '',
    value: 0,
    dueDate: new Date().toISOString().split('T')[0]
  });
  const [initialFile, setInitialFile] = useState<ProjectFile | null>(null);
  const initialFileRef = useRef<File | null>(null);

  const filteredProjects = projects.filter((p: Project) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgress = (projectId: string) => {
    const projectTasks = tasks.filter((t: any) => t.projectId === projectId);
    if (!projectTasks.length) return 0;
    const completed = projectTasks.filter((t: any) => t.status === 'concluida').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Armazenar o arquivo File para upload posterior
      initialFileRef.current = file;
      setInitialFile({
        id: `temp-${Date.now()}`,
        name: file.name,
        url: '', // Será preenchido após upload
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Criar projeto primeiro
    const project: Omit<Project, 'id'> = {
      ...newProject,
      startDate: new Date().toISOString().split('T')[0],
      status: ProjectStatus.ACTIVE,
      files: []
    };
    
    const createdProject = await addProject(project);
    
    if (createdProject && initialFileRef.current) {
      // Fazer upload do arquivo inicial para o Storage
      await projectFileService.uploadFile(createdProject.id, initialFileRef.current);
    }
    
    setIsModalOpen(false);
    setNewProject({ name: '', clientId: clients[0]?.id || '', description: '', value: 0, dueDate: new Date().toISOString().split('T')[0] });
    setInitialFile(null);
    initialFileRef.current = null;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Projetos</h1>
          <p className="text-gray-500 mt-2 font-medium">Gerencie e acompanhe a evolução dos seus projetos ativos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Novo Projeto</span>
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar projeto por nome..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm transition-all text-gray-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project: Project) => {
          const client = clients.find((c: any) => c.id === project.clientId);
          const progress = getProgress(project.id);
          const projectPhases = phases.filter((f: any) => f.projectId === project.id);
          
          return (
            <div 
              key={project.id} 
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  project.status === ProjectStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {project.status}
                </span>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">{project.name}</h3>
              <p className="text-sm text-gray-500 font-medium mb-6">{client?.company || 'Cliente Independente'}</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center text-sm text-gray-600 font-medium space-x-3">
                  <Calendar size={16} className="text-gray-400" />
                  <span>Entrega: {new Date(project.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 font-medium space-x-3">
                  <Layers size={16} className="text-gray-400" />
                  <span>{projectPhases.length} Fases registradas</span>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Progresso</span>
                  <span className="text-sm font-black text-indigo-600">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-indigo-600 font-bold text-sm">
                  <span>Ver detalhes</span>
                  <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal - Constrained to body area by left offset */}
      {isModalOpen && (
        <div className="fixed inset-0 left-0 lg:left-64 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 text-gray-900">
              <h2 className="text-xl font-black">Novo Projeto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleAddProject} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Nome do Projeto</label>
                <input required type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="Ex: App de Delivery" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Cliente</label>
                <select value={newProject.clientId} onChange={e => setNewProject({...newProject, clientId: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Descrição</label>
                <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" rows={3} placeholder="Breve resumo do projeto..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Data de Entrega</label>
                  <input required type="date" value={newProject.dueDate} onChange={e => setNewProject({...newProject, dueDate: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Valor (R$)</label>
                  <input type="number" value={newProject.value} onChange={e => setNewProject({...newProject, value: Number(e.target.value)})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Anexar Contrato</label>
                {initialFile ? (
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText size={18} />
                      <span className="text-xs font-bold truncate">{initialFile.name}</span>
                    </div>
                    <button type="button" onClick={() => setInitialFile(null)} className="text-rose-500 hover:text-rose-700">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-indigo-300 hover:bg-gray-50 transition-all group"
                  >
                    <Upload size={24} className="mx-auto mb-2 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subir Contrato</p>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all mt-4">Criar Projeto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
