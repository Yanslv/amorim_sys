
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Clock, MoreVertical, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Task, Meeting, TaskStatus } from '../types';

const WeeklyView = ({ state }: any) => {
  const { tasks, projects, meetings } = state;
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 to 21:00

  const getDayTasks = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    return tasks.filter((t: Task) => t.startDate === dStr);
  };

  const getDayMeetings = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    return meetings.filter((m: Meeting) => m.date === dStr);
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    setCurrentDate(prev);
  };

  const stats = useMemo(() => {
    const weekStart = days[0].toISOString().split('T')[0];
    const weekEnd = days[6].toISOString().split('T')[0];
    const weekTasks = tasks.filter((t: Task) => t.startDate >= weekStart && t.startDate <= weekEnd);
    const planned = weekTasks.reduce((acc: number, t: any) => acc + (t.estimatedHours || 0), 0);
    const availability = 40; // Default 40h week
    const delayed = weekTasks.filter((t: any) => t.status !== TaskStatus.COMPLETED && t.endDate < new Date().toISOString().split('T')[0]).length;
    
    return {
      planned,
      available: Math.max(0, availability - planned),
      delayed,
      conflicts: 0 // Mocking for now
    };
  }, [days, tasks]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Visão Semanal</h1>
          <p className="text-gray-500 mt-2 font-medium">Gerencie sua agenda e garanta a entrega dos prazos.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={prevWeek} className="p-2 sm:p-3 hover:bg-gray-50 border-r border-gray-100"><ChevronLeft size={18} className="sm:w-5 sm:h-5"/></button>
            <div className="px-3 sm:px-6 py-2 sm:py-3 font-black text-xs sm:text-sm flex items-center min-w-[140px] sm:min-w-[180px] justify-center">
              {days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </div>
            <button onClick={nextWeek} className="p-2 sm:p-3 hover:bg-gray-50 border-l border-gray-100"><ChevronRight size={18} className="sm:w-5 sm:h-5"/></button>
          </div>
          <button 
            onClick={() => navigate('/projects')}
            className="bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:bg-indigo-700 transition-all text-sm sm:text-base"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span>Selecionar Projeto</span>
          </button>
        </div>
      </header>

      {/* Week KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 flex-shrink-0"><Clock size={18} className="sm:w-5 sm:h-5"/></div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">Horas Planejadas</p>
            <p className="text-lg sm:text-xl font-black">{stats.planned}h</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 flex-shrink-0"><Clock size={18} className="sm:w-5 sm:h-5"/></div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">Horas Livres</p>
            <p className="text-lg sm:text-xl font-black">{stats.available}h</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="bg-rose-50 p-2 rounded-lg text-rose-600 flex-shrink-0"><AlertCircle size={18} className="sm:w-5 sm:h-5"/></div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">Atrasos</p>
            <p className="text-lg sm:text-xl font-black">{stats.delayed}</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="bg-amber-50 p-2 rounded-lg text-amber-600 flex-shrink-0"><AlertCircle size={18} className="sm:w-5 sm:h-5"/></div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">Conflitos</p>
            <p className="text-lg sm:text-xl font-black">{stats.conflicts}</p>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <div className="calendar-grid border-b border-gray-100 min-w-[800px]">
            <div className="p-2 sm:p-4 border-r border-gray-100 bg-gray-50"></div>
            {days.map((day, i) => (
              <div key={i} className={`p-2 sm:p-4 text-center border-r border-gray-100 last:border-r-0 ${
                day.toDateString() === new Date().toDateString() ? 'bg-indigo-50' : ''
              }`}>
                <p className="text-[10px] font-black text-gray-400 uppercase">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                <p className={`text-lg sm:text-xl font-black mt-1 ${
                  day.toDateString() === new Date().toDateString() ? 'text-indigo-600' : 'text-gray-900'
                }`}>{day.getDate()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <div className="calendar-grid min-h-[600px] sm:min-h-[800px] min-w-[800px]">
            {/* Hours Column */}
            <div className="border-r border-gray-100 bg-gray-50 flex flex-col sticky left-0 z-10">
              {hours.map(h => (
                <div key={h} className="h-16 sm:h-20 p-1 sm:p-2 text-[9px] sm:text-[10px] font-black text-gray-400 text-right border-b border-gray-100 bg-gray-50">
                  {h.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {days.map((day, i) => {
              const dayTasks = getDayTasks(day);
              const dayMeetings = getDayMeetings(day);
              
              return (
                <div key={i} className="relative border-r border-gray-100 last:border-r-0 group">
                  {hours.map(h => <div key={h} className="h-20 border-b border-gray-50"></div>)}
                  
                  {/* Task & Meeting Overlays */}
                  {dayTasks.map(task => {
                    const startHour = parseInt(task.startTime.split(':')[0]);
                    const hourHeight = 64; // h-16 = 64px em mobile, h-20 = 80px em desktop
                    const top = (startHour - 8) * hourHeight;
                    const duration = task.estimatedHours * hourHeight;
                    
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => navigate(`/projects/${task.projectId}`)}
                        className={`absolute left-1 right-1 rounded-lg p-1.5 sm:p-2 text-white shadow-md border-l-4 overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform ${
                          task.status === TaskStatus.COMPLETED ? 'bg-emerald-500 border-emerald-700 opacity-60' : 'bg-indigo-600 border-indigo-800'
                        }`}
                        style={{ top: `${top}px`, height: `${duration}px` }}
                      >
                        <p className="text-[9px] sm:text-[10px] font-black opacity-80 truncate">{projects.find((p: any) => p.id === task.projectId)?.name}</p>
                        <p className="text-[10px] sm:text-xs font-bold leading-tight mt-0.5 line-clamp-2">{task.title}</p>
                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />
                        </div>
                      </div>
                    );
                  })}

                  {dayMeetings.map(meeting => {
                    const startHour = parseInt(meeting.startTime.split(':')[0]);
                    const hourHeight = 64; // h-16 = 64px em mobile
                    const top = (startHour - 8) * hourHeight;
                    
                    return (
                      <div 
                        key={meeting.id} 
                        className="absolute left-1 right-1 bg-amber-500 border-l-4 border-amber-700 rounded-lg p-1.5 sm:p-2 text-white shadow-md h-16 sm:h-20"
                        style={{ top: `${top}px` }}
                      >
                        <p className="text-[9px] sm:text-[10px] font-black opacity-80">REUNIÃO</p>
                        <p className="text-[10px] sm:text-xs font-bold leading-tight mt-0.5 truncate">{meeting.title}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyView;
