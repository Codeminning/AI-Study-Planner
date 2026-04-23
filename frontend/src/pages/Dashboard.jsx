import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { 
  CheckCircle2, 
  Circle, 
  RotateCw, 
  BrainCircuit, 
  CalendarDays, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  PlayCircle,
  X,
  Loader2,
  Video,
  ExternalLink
} from 'lucide-react';
import Layout from '../components/Layout';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskContent, setTaskContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await axios.get(`${API_BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.put(`${API_BASE_URL}/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
    } catch (error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
    }
  };

  const handleReschedule = async () => {
    setRescheduling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.post(`${API_BASE_URL}/reschedule`, { hours_per_day: 2 }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      await fetchTasks();
    } catch (error) {
      console.error('Failed to reschedule', error);
      alert('Rescheduling failed.');
    } finally {
      setRescheduling(false);
    }
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const todayTasks = tasks.filter(t => isToday(parseISO(t.date)));
  const queueTasks = tasks.filter(t => !isToday(parseISO(t.date)));

  const handleTaskClick = async (task) => {
    setSelectedTask(task);
    setTaskContent(null);
    setLoadingContent(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await axios.get(`${API_BASE_URL}/task-content/${task.id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setTaskContent(res.data);
    } catch (err) {
      console.error("Failed to fetch task content", err);
    } finally {
      setLoadingContent(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-indigo-600 font-semibold animate-pulse">
          <BrainCircuit className="w-12 h-12" />
          <p>Analyzing Progress...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Dashboard Overview">
      <div className="space-y-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Progress" 
            value={`${progress}%`} 
            icon={TrendingUp} 
            color="text-indigo-600" 
            bgColor="bg-indigo-50"
          />
          <StatCard 
            title="Completed Tasks" 
            value={completedCount} 
            icon={CheckCircle} 
            color="text-emerald-600" 
            bgColor="bg-emerald-50"
          />
          <StatCard 
            title="Pending Tasks" 
            value={totalCount - completedCount} 
            icon={Clock} 
            color="text-orange-600" 
            bgColor="bg-orange-50"
          />
        </div>

        {/* Progress Overview Card */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Execution Progress</h3>
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {completedCount} / {totalCount} Tasks
            </span>
          </div>
          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Tasks */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" /> Today's Focus
              </h2>
              <button 
                onClick={handleReschedule}
                disabled={rescheduling}
                className="text-xs font-bold flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                <RotateCw className={`w-3.5 h-3.5 ${rescheduling ? 'animate-spin text-indigo-600' : ''}`} />
                {rescheduling ? 'Rebalancing...' : 'Reschedule Overdue'}
              </button>
            </div>
            
            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-300 rounded-3xl text-gray-400">
                  No tasks for today. Rest up!
                </div>
              ) : (
                todayTasks.map(task => (
                  <TaskCard key={task.id} task={task} onToggle={() => toggleTaskStatus(task.id, task.status)} onClick={() => handleTaskClick(task)} />
                ))
              )}
            </div>
          </div>

          {/* Pending/Upcoming */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Queue</h2>
            <div className="bg-white border border-gray-200 rounded-3xl p-4 max-h-[600px] overflow-y-auto space-y-3 custom-scrollbar shadow-sm">
              {queueTasks.length === 0 ? (
                <p className="text-center py-10 text-sm text-gray-400">All clear!</p>
              ) : (
                queueTasks.map(task => (
                  <TaskCard key={task.id} task={task} compact onToggle={() => toggleTaskStatus(task.id, task.status)} onClick={() => handleTaskClick(task)} />
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Task Content Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 pr-8">{selectedTask.topic}</h2>
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {loadingContent ? (
                <div className="flex flex-col items-center justify-center py-16 text-indigo-600 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-sm font-medium text-gray-500">Generating AI Study Material...</p>
                </div>
              ) : taskContent ? (
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Explanation</h3>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      {taskContent.explanation}
                    </p>
                  </section>

                  {taskContent.key_points && taskContent.key_points.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Key Points</h3>
                      <ul className="space-y-3">
                        {taskContent.key_points.map((pt, idx) => (
                          <li key={idx} className="flex gap-3 text-gray-700 items-start">
                            <span className="text-indigo-500 mt-1 flex-shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {taskContent.resources && taskContent.resources.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Learning Resources</h3>
                      <div className="grid gap-3">
                        {taskContent.resources.map((res, idx) => (
                          <a 
                            key={idx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${res.type === 'youtube' ? 'bg-red-50 text-red-500 group-hover:bg-red-100' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'}`}>
                                {res.type === 'youtube' ? <Video className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                              </div>
                              <span className="font-medium text-gray-800 line-clamp-1">{res.title}</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                          </a>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-red-500">
                  Failed to load content. Please try again later.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedTask(null)}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
      <div className={`p-4 ${bgColor} rounded-2xl`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TaskCard({ task, compact = false, onToggle, onClick }) {
  const isCompleted = task.status === 'completed';
  const isOverdue = isPast(parseISO(task.date)) && !isToday(parseISO(task.date)) && !isCompleted;

  return (
    <div 
      onClick={onClick}
      className={`group p-4 bg-white border rounded-2xl transition-all cursor-pointer flex items-center gap-4 ${isCompleted ? 'border-gray-100 bg-gray-50/50 opacity-75' : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg shadow-sm'}`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`flex-shrink-0 transition-transform hover:scale-110 ${isCompleted ? 'text-emerald-500' : 'text-gray-300'}`}
      >
        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={`font-semibold truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-indigo-600 transition-colors'} ${compact ? 'text-sm' : 'text-base'}`}>
            {task.topic}
          </h4>
          {isCompleted && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">
              Completed
            </span>
          )}
        </div>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {task.subjects?.name}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 font-medium">{task.duration} hrs</span>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center gap-3 text-right">
        {task.resource_url && !compact && (
          <a 
            href={task.resource_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50"
            onClick={(e) => e.stopPropagation()}
          >
            <PlayCircle className="w-4 h-4" /> Watch
          </a>
        )}
        {isOverdue && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 px-2 py-1 rounded-lg">
            Overdue
          </span>
        )}
        {!isOverdue && compact && (
          <span className="text-xs text-gray-400 font-medium">
            {format(parseISO(task.date), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}
