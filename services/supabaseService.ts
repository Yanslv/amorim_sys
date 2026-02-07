import { supabase } from '../lib/supabase';
import { 
  Client, 
  Project, 
  Phase, 
  Task, 
  Meeting, 
  ProjectFile,
  TaskHistoryEntry 
} from '../types';

// ==========================================
// CLIENTES
// ==========================================

export const clientService = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
    
    return data.map(mapClientFromDB);
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
    
    return mapClientFromDB(data);
  },

  async create(client: Omit<Client, 'id'>): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .insert(mapClientToDB(client))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar cliente:', error);
      return null;
    }
    
    return mapClientFromDB(data);
  },

  async update(id: string, updates: Partial<Client>): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .update(mapClientToDB(updates as Client))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return null;
    }
    
    return mapClientFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar cliente:', error);
      return false;
    }
    
    return true;
  }
};

// ==========================================
// PROJETOS
// ==========================================

export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar projetos:', error);
      return [];
    }
    
    return Promise.all(data.map(mapProjectFromDB));
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar projeto:', error);
      return null;
    }
    
    return mapProjectFromDB(data);
  },

  async create(project: Omit<Project, 'id'>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .insert(mapProjectToDB(project))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar projeto:', error);
      return null;
    }
    
    return mapProjectFromDB(data);
  },

  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    const dbUpdates: any = {};
    
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.startDate) dbUpdates.start_date = updates.startDate;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.currentPhaseId !== undefined) dbUpdates.current_phase_id = updates.currentPhaseId;
    
    // Arquivos são gerenciados separadamente via projectFileService
    // Não precisamos atualizar aqui, apenas sincronizar a lista
    
    const { data, error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar projeto:', error);
      return null;
    }
    
    return mapProjectFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar projeto:', error);
      return false;
    }
    
    return true;
  }
};

// ==========================================
// FASES
// ==========================================

export const phaseService = {
  async getAll(projectId?: string): Promise<Phase[]> {
    let query = supabase
      .from('phases')
      .select('*');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query.order('order_number', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar fases:', error);
      return [];
    }
    
    return data.map(mapPhaseFromDB);
  },

  async create(phase: Omit<Phase, 'id'>): Promise<Phase | null> {
    const { data, error } = await supabase
      .from('phases')
      .insert(mapPhaseToDB(phase))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar fase:', error);
      return null;
    }
    
    return mapPhaseFromDB(data);
  },

  async update(id: string, updates: Partial<Phase>): Promise<Phase | null> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.order !== undefined) dbUpdates.order_number = updates.order;
    if (updates.status) dbUpdates.status = updates.status;
    
    const { data, error } = await supabase
      .from('phases')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar fase:', error);
      return null;
    }
    
    return mapPhaseFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('phases')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar fase:', error);
      return false;
    }
    
    return true;
  }
};

// ==========================================
// TAREFAS
// ==========================================

export const taskService = {
  async getAll(projectId?: string): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar tarefas:', error);
      return [];
    }
    
    return Promise.all(data.map(mapTaskFromDB));
  },

  async create(task: Omit<Task, 'id'>): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(mapTaskToDB(task))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar tarefa:', error);
      return null;
    }
    
    return mapTaskFromDB(data);
  },

  async update(id: string, updates: Partial<Task>, observation?: string): Promise<Task | null> {
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.startDate) dbUpdates.start_date = updates.startDate;
    if (updates.startTime) dbUpdates.start_time = updates.startTime;
    if (updates.endDate) dbUpdates.end_date = updates.endDate;
    if (updates.endTime) dbUpdates.end_time = updates.endTime;
    if (updates.estimatedHours !== undefined) dbUpdates.estimated_hours = updates.estimatedHours;
    if (updates.priority) dbUpdates.priority = updates.priority;
    
    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return null;
    }
    
    // Se houve mudança de status e observação, adicionar ao histórico
    if (updates.status && observation) {
      await taskHistoryService.add(id, updates.status, observation);
    }
    
    return mapTaskFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar tarefa:', error);
      return false;
    }
    
    return true;
  }
};

// ==========================================
// HISTÓRICO DE TAREFAS
// ==========================================

export const taskHistoryService = {
  async getByTaskId(taskId: string): Promise<TaskHistoryEntry[]> {
    const { data, error } = await supabase
      .from('task_history')
      .select('*')
      .eq('task_id', taskId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
    
    return data.map(mapTaskHistoryFromDB);
  },

  async add(taskId: string, status: string, observation: string): Promise<TaskHistoryEntry | null> {
    const { data, error } = await supabase
      .from('task_history')
      .insert({
        task_id: taskId,
        status,
        observation
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao adicionar histórico:', error);
      return null;
    }
    
    return mapTaskHistoryFromDB(data);
  }
};

// ==========================================
// REUNIÕES
// ==========================================

export const meetingService = {
  async getAll(): Promise<Meeting[]> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar reuniões:', error);
      return [];
    }
    
    return data.map(mapMeetingFromDB);
  },

  async create(meeting: Omit<Meeting, 'id'>): Promise<Meeting | null> {
    const { data, error } = await supabase
      .from('meetings')
      .insert(mapMeetingToDB(meeting))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar reunião:', error);
      return null;
    }
    
    return mapMeetingFromDB(data);
  },

  async update(id: string, updates: Partial<Meeting>): Promise<Meeting | null> {
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.agenda !== undefined) dbUpdates.agenda = updates.agenda;
    if (updates.date) dbUpdates.meeting_date = updates.date;
    if (updates.startTime) dbUpdates.start_time = updates.startTime;
    if (updates.endTime) dbUpdates.end_time = updates.endTime;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.observations !== undefined) dbUpdates.observations = updates.observations;
    
    const { data, error } = await supabase
      .from('meetings')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar reunião:', error);
      return null;
    }
    
    return mapMeetingFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar reunião:', error);
      return false;
    }
    
    return true;
  }
};

// ==========================================
// ARQUIVOS DO PROJETO (Supabase Storage)
// ==========================================

const STORAGE_BUCKET = 'arquivos_de_projetos';

export const projectFileService = {
  /**
   * Faz upload de um arquivo para o Supabase Storage
   */
  async uploadFile(projectId: string, file: File): Promise<ProjectFile | null> {
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Fazer upload para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Erro ao fazer upload do arquivo:', uploadError);
        return null;
      }
      
      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);
      
      // Salvar referência no banco de dados
      const { data, error } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          name: file.name,
          url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao salvar referência do arquivo:', error);
        // Tentar deletar o arquivo do Storage se falhar ao salvar no banco
        await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
        return null;
      }
      
      return mapProjectFileFromDB(data);
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      return null;
    }
  },

  /**
   * Busca todos os arquivos de um projeto
   */
  async getByProjectId(projectId: string): Promise<ProjectFile[]> {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar arquivos:', error);
      return [];
    }
    
    return data.map(mapProjectFileFromDB);
  },

  /**
   * Deleta um arquivo do Storage e do banco de dados
   */
  async delete(id: string, fileUrl: string): Promise<boolean> {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts.slice(urlParts.indexOf(STORAGE_BUCKET) + 1).join('/');
      
      // Deletar do Storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileName]);
      
      if (storageError) {
        console.warn('Erro ao deletar arquivo do Storage (continuando...):', storageError);
        // Continua mesmo se falhar no Storage
      }
      
      // Deletar referência do banco
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', id);
      
      if (dbError) {
        console.error('Erro ao deletar referência do arquivo:', dbError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      return false;
    }
  },

  /**
   * Obtém URL pública de download do arquivo
   */
  getPublicUrl(fileUrl: string): string {
    return fileUrl;
  },

  /**
   * Faz download de um arquivo (retorna blob)
   */
  async downloadFile(fileUrl: string): Promise<Blob | null> {
    try {
      const urlParts = fileUrl.split('/');
      const fileName = urlParts.slice(urlParts.indexOf(STORAGE_BUCKET) + 1).join('/');
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(fileName);
      
      if (error) {
        console.error('Erro ao fazer download do arquivo:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao fazer download do arquivo:', error);
      return null;
    }
  }
};

// ==========================================
// MAPEAMENTO DE DADOS (DB ↔ App)
// ==========================================

function mapClientFromDB(data: any): Client {
  return {
    id: data.id,
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone || '',
    status: data.status,
    observations: data.observations || ''
  };
}

function mapClientToDB(client: Partial<Client>): any {
  return {
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    status: client.status,
    observations: client.observations
  };
}

async function mapProjectFromDB(data: any): Promise<Project> {
  // Buscar arquivos do projeto
  const files = await projectFileService.getByProjectId(data.id);
  
  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    description: data.description || '',
    value: parseFloat(data.value) || 0,
    startDate: data.start_date,
    dueDate: data.due_date,
    status: data.status,
    currentPhaseId: data.current_phase_id,
    files: files
  };
}

function mapProjectToDB(project: Partial<Project>): any {
  return {
    client_id: project.clientId,
    name: project.name,
    description: project.description,
    value: project.value,
    start_date: project.startDate,
    due_date: project.dueDate,
    status: project.status,
    current_phase_id: project.currentPhaseId
  };
}

function mapPhaseFromDB(data: any): Phase {
  return {
    id: data.id,
    projectId: data.project_id,
    name: data.name,
    order: data.order_number,
    status: data.status
  };
}

function mapPhaseToDB(phase: Partial<Phase>): any {
  return {
    project_id: phase.projectId,
    name: phase.name,
    order_number: phase.order,
    status: phase.status
  };
}

async function mapTaskFromDB(data: any): Promise<Task> {
  // Buscar histórico da tarefa
  const history = await taskHistoryService.getByTaskId(data.id);
  
  return {
    id: data.id,
    projectId: data.project_id,
    phaseId: data.phase_id,
    title: data.title,
    description: data.description || '',
    status: data.status,
    startDate: data.start_date,
    startTime: data.start_time,
    endDate: data.end_date,
    endTime: data.end_time,
    estimatedHours: parseFloat(data.estimated_hours) || 0,
    priority: data.priority,
    history: history
  };
}

function mapTaskToDB(task: Partial<Task>): any {
  return {
    project_id: task.projectId,
    phase_id: task.phaseId,
    title: task.title,
    description: task.description,
    status: task.status,
    start_date: task.startDate,
    start_time: task.startTime,
    end_date: task.endDate,
    end_time: task.endTime,
    estimated_hours: task.estimatedHours,
    priority: task.priority
  };
}

function mapTaskHistoryFromDB(data: any): TaskHistoryEntry {
  return {
    status: data.status,
    observation: data.observation,
    timestamp: data.timestamp
  };
}

function mapMeetingFromDB(data: any): Meeting {
  return {
    id: data.id,
    projectId: data.project_id,
    clientId: data.client_id,
    title: data.title,
    agenda: data.agenda || '',
    date: data.meeting_date,
    startTime: data.start_time,
    endTime: data.end_time,
    status: data.status,
    observations: data.observations || ''
  };
}

function mapMeetingToDB(meeting: Partial<Meeting>): any {
  return {
    project_id: meeting.projectId,
    client_id: meeting.clientId,
    title: meeting.title,
    agenda: meeting.agenda,
    meeting_date: meeting.date,
    start_time: meeting.startTime,
    end_time: meeting.endTime,
    status: meeting.status,
    observations: meeting.observations
  };
}

function mapProjectFileFromDB(data: any): ProjectFile {
  return {
    id: data.id,
    name: data.name,
    url: data.url,
    type: data.file_type || '',
    size: data.file_size || 0,
    uploadedAt: data.uploaded_at
  };
}
