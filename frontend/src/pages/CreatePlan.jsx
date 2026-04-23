import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, BookOpen, BrainCircuit, Sparkles, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CreatePlan() {
  const [formData, setFormData] = useState({
    subjects: '',
    topics: '',
    deadline: '',
    hours_per_day: 2,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        subjects: formData.subjects.split(',').map(s => s.trim()),
        topics: formData.topics,
        deadline: formData.deadline,
        hours_per_day: parseFloat(formData.hours_per_day),
      };
      
      const { data: { session } } = await supabase.auth.getSession();
      await axios.post(`${API_BASE_URL}/create-plan`, payload, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Failed to create plan', error);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Create Study Plan">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-600 rounded-2xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New AI Plan</h1>
              <p className="text-gray-500 text-sm">Our agent will craft a personalized schedule for you.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Subjects
              </label>
              <input
                type="text"
                name="subjects"
                required
                value={formData.subjects}
                onChange={handleChange}
                placeholder="e.g. Computer Science, Math"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-600" /> Specific Topics
              </label>
              <textarea
                name="topics"
                required
                value={formData.topics}
                onChange={handleChange}
                placeholder="List topics you need to master..."
                rows="3"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" /> Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  required
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> Study Hours / Day
                </label>
                <input
                  type="number"
                  name="hours_per_day"
                  min="0.5"
                  step="0.5"
                  required
                  value={formData.hours_per_day}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 ${loading || success ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Agent is Planning...
                </>
              ) : success ? (
                'Plan Generated Successfully!'
              ) : (
                'Generate Execution Plan'
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
