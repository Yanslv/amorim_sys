
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Video, 
  Calendar, 
  Clock, 
  Search, 
  MoreVertical, 
  X, 
  AlertCircle, 
  Trash2,
  CheckCircle,
  XCircle,
  Briefcase,
  Users
} from 'lucide-react';
import { Meeting, MeetingStatus } from '../types';

const MeetingList = ({ state }: any) => {
  const { meetings, projects, clients, addMeeting, deleteMeeting, updateMeeting } = state;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Abrir modal automaticamente se houver query parameter 'new'
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
      setSearchParams({}); // Remove o query parameter após abrir
    }
  }, [searchParams, setSearchParams]);
  
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    agenda: '',
    observations: ''
  });

  const filteredMeetings = meetings.filter((m: Meeting) => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.agenda.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a: Meeting, b: Meeting) => a.date.localeCompare(b.date));

  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple conflict check
    const hasConflict = meetings.some((m: Meeting) => 
      m.date === newMeeting.date && 
      ((newMeeting.startTime >= m.startTime && newMeeting.startTime < m.endTime) ||
       (newMeeting.endTime > m.startTime && newMeeting.endTime <= m.endTime))
    );

    if (hasConflict) {
      if (!confirm('Já existe uma reunião agendada neste horário. Deseja prosseguir mesmo assim?')) {
        return;
      }
    }

    const project = projects.find((p: any) => p.id === newMeeting.projectId);
    
    const meeting: Meeting = {
      ...newMeeting,
      id: `m-${Date.now()}`,
      clientId: project?.clientId || '',
      status: MeetingStatus.SCHEDULED,
      observations: newMeeting.observations,
      agenda: newMeeting.agenda,
      projectId: newMeeting.projectId
    };

    addMeeting(meeting);
    setIsModalOpen(false);
    setNewMeeting({
      title: '',
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      agenda: '',
      observations: ''
    });
  };

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case MeetingStatus.SCHEDULED:
        return <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Agendada</span>;
      case MeetingStatus.HELD:
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Realizada</span>;
      case MeetingStatus.CANCELLED:
        return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Cancelada</span>;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Reuniões</h1>
          <p className="text-gray-500 mt-2 font-medium">Controle seus alinhamentos e pautas com clientes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg"
        >
          <Plus size={20} />
          <span>Agendar Reunião</span>
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar reunião por título ou pauta..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm transition-all text-gray-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredMeetings.map((meeting: Meeting) => {
          const project = projects.find((p: any) => p.id === meeting.projectId);
          const client = clients.find((c: any) => c.id === meeting.clientId);
          
          return (
            <div key={meeting.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 hover:shadow-md transition-shadow group">
              <div className="flex items-start sm:items-center space-x-4 sm:space-x-6 flex-1 min-w-0">
                <div className="bg-indigo-50 text-indigo-600 p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center min-w-[60px] sm:min-w-[80px] flex-shrink-0">
                  <span className="text-[10px] sm:text-xs font-black uppercase">{new Date(meeting.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  <span className="text-xl sm:text-2xl font-black">{new Date(meeting.date + 'T00:00:00').getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{meeting.title}</h3>
                    {getStatusBadge(meeting.status)}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 font-medium">
                    <span className="flex items-center space-x-1">
                      <Clock size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span>{meeting.startTime}h - {meeting.endTime}h</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Briefcase size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{project?.name || 'Sem projeto'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{client?.company || client?.name || 'Sem cliente'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end sm:justify-start space-x-2 flex-shrink-0">
                {meeting.status === MeetingStatus.SCHEDULED && (
                  <>
                    <button 
                      onClick={() => updateMeeting(meeting.id, { status: MeetingStatus.HELD })}
                      className="p-3 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                      title="Marcar como realizada"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button 
                      onClick={() => updateMeeting(meeting.id, { status: MeetingStatus.CANCELLED })}
                      className="p-3 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
                      title="Cancelar reunião"
                    >
                      <XCircle size={20} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => confirm('Excluir esta reunião?') && deleteMeeting(meeting.id)}
                  className="p-3 text-gray-400 hover:text-rose-600 bg-gray-50 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredMeetings.length === 0 && (
          <div className="p-20 text-center text-gray-400 flex flex-col items-center bg-white rounded-3xl border border-dashed border-gray-200">
            <Video size={60} strokeWidth={1} className="mb-4 text-gray-200" />
            <p className="text-lg font-bold">Nenhuma reunião encontrada.</p>
            <p className="text-sm">Agende seus próximos alinhamentos clicando no botão acima.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden my-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 text-gray-900 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-black">Agendar Reunião</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddMeeting} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Título da Reunião</label>
                <input required type="text" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="Ex: Alinhamento de Design" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Projeto Relacionado</label>
                <select required value={newMeeting.projectId} onChange={e => setNewMeeting({...newMeeting, projectId: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                  <option value="">Selecione um projeto...</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Data</label>
                  <input required type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Início</label>
                  <input required type="time" value={newMeeting.startTime} onChange={e => setNewMeeting({...newMeeting, startTime: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Fim</label>
                  <input required type="time" value={newMeeting.endTime} onChange={e => setNewMeeting({...newMeeting, endTime: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Pauta / Agenda</label>
                <textarea rows={3} value={newMeeting.agenda} onChange={e => setNewMeeting({...newMeeting, agenda: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="O que será discutido?"></textarea>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Observações</label>
                <textarea rows={2} value={newMeeting.observations} onChange={e => setNewMeeting({...newMeeting, observations: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="Anotações adicionais..."></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all mt-4">Agendar Reunião</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingList;
