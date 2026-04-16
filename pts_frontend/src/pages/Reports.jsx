// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  TrendingUp,
  Building2,
  Landmark,
  Target,
  Package,
  Calendar,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  BarChart3,
  Table,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import reportsApi from '../services/reportsApi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';

const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [viewMode, setViewMode] = useState('chart');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    department: '',
    agency: '',
    priority_area: ''
  });
  const [departmentsList, setDepartmentsList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [priorityAreasList, setPriorityAreasList] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: 'summary', label: 'Summary', icon: TrendingUp, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { id: 'department', label: 'Departments', icon: Building2, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
    { id: 'agency', label: 'Agencies', icon: Landmark, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50' },
    { id: 'priority_area', label: 'Priority Areas', icon: Target, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
    { id: 'deliverable', label: 'Deliverables', icon: Package, color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50' },
    { id: 'quarterly', label: 'Quarterly', icon: Calendar, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50' },
  ];

  useEffect(() => {
    fetchDropdownData();
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, filters]);

  const fetchDropdownData = async () => {
    try {
      const { default: mainApi } = await import('../services/mainApi');
      const [deptRes, agencyRes, priorityRes] = await Promise.all([
        mainApi.departments.list(),
        mainApi.agencies.list(),
        mainApi.priorityAreas.list()
      ]);
      setDepartmentsList(deptRes.data);
      setAgenciesList(agencyRes.data);
      setPriorityAreasList(priorityRes.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const { default: mainApi } = await import('../services/mainApi');
      const response = await mainApi.initiatives.list();
      const initiatives = response.data.results || response.data;
      const years = [...new Set(initiatives.map(i => new Date(i.start_date).getFullYear()))];
      setAvailableYears(years.sort((a, b) => b - a));
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.year) params.year = filters.year;
      if (filters.department) params.department = filters.department;
      if (filters.agency) params.agency = filters.agency;
      if (filters.priority_area) params.priority_area = filters.priority_area;
      
      const response = await reportsApi.getReportData(activeTab, params);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
  setExporting(true);
  try {
    const params = {};
    if (filters.year) params.year = filters.year;
    if (filters.department) params.department = filters.department;
    if (filters.agency) params.agency = filters.agency;
    if (filters.priority_area) params.priority_area = filters.priority_area;
    
    const response = await reportsApi.exportReport(activeTab, format, params);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(`Report exported as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Error exporting report:', error);
    toast.error('Failed to export report');
  } finally {
    setExporting(false);
  }
};

  const resetFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      department: '',
      agency: '',
      priority_area: ''
    });
  };

  const COLORS = ['#22c55e', '#10b981', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  const renderSummary = () => {
    if (!reportData?.summary) return null;
    
    const summary = reportData.summary;
    const ratingData = Object.entries(reportData.rating_distribution || {}).map(([name, value]) => ({ name, value }));
    const quarterlyData = reportData.quarterly_trend || [];

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center border border-blue-200 hover:shadow-md transition">
            <div className="text-2xl font-bold text-blue-600">{summary.total_initiatives || 0}</div>
            <div className="text-xs text-gray-600 mt-0.5">Total Initiatives</div>
            <div className="text-xs text-gray-400 mt-1">Projects: {summary.total_projects || 0} | Programs: {summary.total_programs || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center border border-green-200 hover:shadow-md transition">
            <div className="text-2xl font-bold text-green-600">{summary.completion_rate?.toFixed(1) || 0}%</div>
            <div className="text-xs text-gray-600 mt-0.5">Completion Rate</div>
            <div className="text-xs text-gray-400 mt-1">{summary.completed || 0} of {summary.total_initiatives || 0} completed</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center border border-purple-200 hover:shadow-md transition">
            <div className="text-2xl font-bold text-purple-600">{summary.avg_rating?.toFixed(1) || 0}/5</div>
            <div className="text-xs text-gray-600 mt-0.5">Average Rating</div>
            <div className="text-xs text-gray-400 mt-1">Based on performance assessment</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 text-center border border-orange-200 hover:shadow-md transition">
            <div className="text-2xl font-bold text-orange-600">{summary.overall_achievement?.toFixed(1) || 0}%</div>
            <div className="text-xs text-gray-600 mt-0.5">Overall Achievement</div>
            <div className="text-xs text-gray-400 mt-1">Target: {summary.total_target || 0} | Actual: {summary.total_actual || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Performance Rating Distribution</h3>
              <div className="text-xs text-gray-400">{ratingData.reduce((sum, d) => sum + d.value, 0)} total ratings</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ratingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ratingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quarterly Performance Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={quarterlyData}>
                <defs>
                  <linearGradient id="achievementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="achievement" stroke="#22c55e" fill="url(#achievementGradient)" name="Achievement %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Initiative Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Planning', value: summary.planning || 0, color: '#f59e0b' },
              { name: 'Ongoing', value: summary.ongoing || 0, color: '#3b82f6' },
              { name: 'Completed', value: summary.completed || 0, color: '#22c55e' }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]}>
                {[
                  { name: 'Planning', value: summary.planning || 0, color: '#f59e0b' },
                  { name: 'Ongoing', value: summary.ongoing || 0, color: '#3b82f6' },
                  { name: 'Completed', value: summary.completed || 0, color: '#22c55e' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDepartmentView = () => {
    const data = Array.isArray(reportData) ? reportData : [];
    
    if (viewMode === 'chart') {
      // Use horizontal bar chart with better spacing to prevent label overlap
      const chartData = [...data].sort((a, b) => b.avg_achievement - a.avg_achievement);
      
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Department Performance Ranking</h3>
            <ResponsiveContainer width="100%" height={Math.max(350, data.length * 45)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 120, right: 30, top: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120} 
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar 
                  dataKey="avg_achievement" 
                  fill="#22c55e" 
                  radius={[0, 4, 4, 0]} 
                  name="Achievement %"
                  label={{ position: 'right', formatter: (value) => `${value.toFixed(0)}%`, fontSize: 10 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map((dept, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{dept.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0 ml-2">{dept.initiative_count} initiatives</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div><span className="text-gray-500">Projects:</span> <span className="font-medium">{dept.project_count}</span></div>
                  <div><span className="text-gray-500">Programs:</span> <span className="font-medium">{dept.program_count}</span></div>
                  <div><span className="text-gray-500">Completed:</span> <span className="font-medium text-green-600">{dept.completed_count}</span></div>
                  <div><span className="text-gray-500">Rating:</span> <span className="font-medium">{dept.avg_rating?.toFixed(1)}/5</span></div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Achievement</span>
                    <span className="font-medium text-blue-600">{dept.avg_achievement?.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: `${dept.avg_achievement || 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600">Department</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Initiatives</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Projects</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Programs</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Completed</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Rating</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Achievement</th>
            </tr>
          </thead>
          <tbody>
            {data.map((dept, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{dept.name}</td>
                <td className="py-2 px-3 text-center">{dept.initiative_count}</td>
                <td className="py-2 px-3 text-center">{dept.project_count}</td>
                <td className="py-2 px-3 text-center">{dept.program_count}</td>
                <td className="py-2 px-3 text-center text-green-600">{dept.completed_count}</td>
                <td className="py-2 px-3 text-center">{dept.avg_rating?.toFixed(1)}/5</td>
                <td className="py-2 px-3 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${dept.avg_achievement || 0}%` }} />
                    </div>
                    <span className="text-xs">{dept.avg_achievement?.toFixed(0)}%</span>
                  </div>
                </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAgencyView = () => {
    const data = Array.isArray(reportData) ? reportData : [];
    
    if (viewMode === 'chart') {
      const chartData = [...data].sort((a, b) => b.avg_achievement - a.avg_achievement);
      
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Agency Performance Ranking</h3>
            <ResponsiveContainer width="100%" height={Math.max(350, data.length * 45)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 140, right: 30, top: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={140} 
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar 
                  dataKey="avg_achievement" 
                  fill="#06b6d4" 
                  radius={[0, 4, 4, 0]} 
                  name="Achievement %"
                  label={{ position: 'right', formatter: (value) => `${value.toFixed(0)}%`, fontSize: 10 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map((agency, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{agency.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0 ml-2">{agency.initiative_count} initiatives</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div><span className="text-gray-500">Projects:</span> <span className="font-medium">{agency.project_count}</span></div>
                  <div><span className="text-gray-500">Programs:</span> <span className="font-medium">{agency.program_count}</span></div>
                  <div><span className="text-gray-500">Completed:</span> <span className="font-medium text-green-600">{agency.completed_count}</span></div>
                  <div><span className="text-gray-500">Rating:</span> <span className="font-medium">{agency.avg_rating?.toFixed(1)}/5</span></div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Achievement</span>
                    <span className="font-medium text-blue-600">{agency.avg_achievement?.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full" style={{ width: `${agency.avg_achievement || 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600">Agency</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Initiatives</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Projects</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Programs</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Completed</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Rating</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Achievement</th>
             </tr>
          </thead>
          <tbody>
            {data.map((agency, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{agency.name}</td>
                <td className="py-2 px-3 text-center">{agency.initiative_count}</td>
                <td className="py-2 px-3 text-center">{agency.project_count}</td>
                <td className="py-2 px-3 text-center">{agency.program_count}</td>
                <td className="py-2 px-3 text-center text-green-600">{agency.completed_count}</td>
                <td className="py-2 px-3 text-center">{agency.avg_rating?.toFixed(1)}/5</td>
                <td className="py-2 px-3 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${agency.avg_achievement || 0}%` }} />
                    </div>
                    <span className="text-xs">{agency.avg_achievement?.toFixed(0)}%</span>
                  </div>
                </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPriorityAreaView = () => {
    const data = Array.isArray(reportData) ? reportData : [];
    
    if (viewMode === 'chart') {
      const chartData = [...data].sort((a, b) => b.avg_achievement - a.avg_achievement);
      
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Priority Area Performance Ranking</h3>
            <ResponsiveContainer width="100%" height={Math.max(350, data.length * 45)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 140, right: 30, top: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={140} 
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar 
                  dataKey="avg_achievement" 
                  fill="#f97316" 
                  radius={[0, 4, 4, 0]} 
                  name="Achievement %"
                  label={{ position: 'right', formatter: (value) => `${value.toFixed(0)}%`, fontSize: 10 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map((pa, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{pa.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0 ml-2">{pa.initiative_count} initiatives</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div><span className="text-gray-500">Completed:</span> <span className="font-medium text-green-600">{pa.completed_count}</span></div>
                  <div><span className="text-gray-500">Ongoing:</span> <span className="font-medium">{pa.ongoing_count}</span></div>
                  <div><span className="text-gray-500">Rating:</span> <span className="font-medium">{pa.avg_rating?.toFixed(1)}/5</span></div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Achievement</span>
                    <span className="font-medium text-orange-600">{pa.avg_achievement?.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" style={{ width: `${pa.avg_achievement || 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600">Priority Area</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Initiatives</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Completed</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Ongoing</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Rating</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Achievement</th>
             </tr>
          </thead>
          <tbody>
            {data.map((pa, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{pa.name}</td>
                <td className="py-2 px-3 text-center">{pa.initiative_count}</td>
                <td className="py-2 px-3 text-center text-green-600">{pa.completed_count}</td>
                <td className="py-2 px-3 text-center">{pa.ongoing_count}</td>
                <td className="py-2 px-3 text-center">{pa.avg_rating?.toFixed(1)}/5</td>
                <td className="py-2 px-3 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pa.avg_achievement || 0}%` }} />
                    </div>
                    <span className="text-xs">{pa.avg_achievement?.toFixed(0)}%</span>
                  </div>
                </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDeliverableView = () => {
    const data = Array.isArray(reportData) ? reportData : [];
    
    if (viewMode === 'chart') {
      const chartData = [...data].sort((a, b) => b.achievement_percentage - a.achievement_percentage).slice(0, 15);
      
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top 15 Deliverable Achievement</h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 180, right: 30, top: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={180} 
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar 
                  dataKey="achievement_percentage" 
                  fill="#14b8a6" 
                  radius={[0, 4, 4, 0]} 
                  name="Achievement %"
                  label={{ position: 'right', formatter: (value) => `${value.toFixed(0)}%`, fontSize: 9 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600">Deliverable</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600">Priority Area</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Q1</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Q2</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Q3</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Q4</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Achievement</th>
             </tr>
          </thead>
          <tbody>
            {data.map((del, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{del.name}</td>
                <td className="py-2 px-3 text-gray-600">{del.priority_area}</td>
                <td className="py-2 px-3 text-center text-xs">
                  <span className="text-gray-500">{del.q1_target}</span> / <span className="text-green-600">{del.q1_actual || '-'}</span>
                </td>
                <td className="py-2 px-3 text-center text-xs">
                  <span className="text-gray-500">{del.q2_target}</span> / <span className="text-green-600">{del.q2_actual || '-'}</span>
                </td>
                <td className="py-2 px-3 text-center text-xs">
                  <span className="text-gray-500">{del.q3_target}</span> / <span className="text-green-600">{del.q3_actual || '-'}</span>
                </td>
                <td className="py-2 px-3 text-center text-xs">
                  <span className="text-gray-500">{del.q4_target}</span> / <span className="text-green-600">{del.q4_actual || '-'}</span>
                </td>
                <td className="py-2 px-3 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                    {del.achievement_percentage?.toFixed(1)}%
                  </div>
                </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderQuarterlyView = () => {
    const data = Array.isArray(reportData) ? reportData : [];
    
    if (viewMode === 'chart') {
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quarterly Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avg_achievement" fill="#22c55e" name="Achievement %" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="deliverable_count" fill="#eab308" name="Deliverables" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.map((quarter) => (
              <div key={quarter.quarter} className="bg-white rounded-xl p-3 border border-gray-200 text-center hover:shadow-md transition">
                <h3 className="text-base font-bold text-gray-900">{quarter.name}</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <p><span className="text-gray-500">Initiatives:</span> <span className="font-semibold">{quarter.initiative_count}</span></p>
                  <p><span className="text-gray-500">Deliverables:</span> <span className="font-semibold">{quarter.deliverable_count}</span></p>
                  <p><span className="text-gray-500">Achievement:</span> <span className="font-semibold text-green-600">{quarter.avg_achievement?.toFixed(1)}%</span></p>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: `${quarter.avg_achievement || 0}%` }} />
                </div>
                <div className="mt-2 flex justify-center gap-1 text-xs">
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">✓ {quarter.completed_count}</span>
                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">⏳ {quarter.pending_count}</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">📝 {quarter.draft_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600">Quarter</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Initiatives</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Deliverables</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Target</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Actual</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Achievement</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((quarter) => (
              <tr key={quarter.quarter} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{quarter.name}</td>
                <td className="py-2 px-3 text-center">{quarter.initiative_count}</td>
                <td className="py-2 px-3 text-center">{quarter.deliverable_count}</td>
                <td className="py-2 px-3 text-center">{quarter.total_target}</td>
                <td className="py-2 px-3 text-center text-green-600">{quarter.total_actual}</td>
                <td className="py-2 px-3 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${quarter.avg_achievement || 0}%` }} />
                    </div>
                    <span className="text-xs">{quarter.avg_achievement?.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">✓{quarter.completed_count}</span>
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">⏳{quarter.pending_count}</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">📝{quarter.draft_count}</span>
                  </div>
                </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading report data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'summary':
        return renderSummary();
      case 'department':
        return renderDepartmentView();
      case 'agency':
        return renderAgencyView();
      case 'priority_area':
        return renderPriorityAreaView();
      case 'deliverable':
        return renderDeliverableView();
      case 'quarterly':
        return renderQuarterlyView();
      default:
        return null;
    }
  };

  const canToggleView = ['department', 'agency', 'priority_area', 'deliverable', 'quarterly'].includes(activeTab);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-xs text-gray-500 mt-0.5">Comprehensive performance reports and analytics</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canToggleView && (
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`p-1.5 px-3 text-sm transition ${viewMode === 'chart' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Chart
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 px-3 text-sm transition ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Table className="w-4 h-4 inline mr-1" />
                  Table
                </button>
              </div>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={resetFilters} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={() => handleExport('excel')} disabled={exporting} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1 transition">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button onClick={() => handleExport('pdf')} disabled={exporting} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1 transition">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {availableYears.length > 0 && (
                <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                  {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              )}
              <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value, agency: '' })} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">All Departments</option>
                {departmentsList.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
              </select>
              <select value={filters.agency} onChange={(e) => setFilters({ ...filters, agency: e.target.value, department: '' })} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">All Agencies</option>
                {agenciesList.map(agency => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
              </select>
              <select value={filters.priority_area} onChange={(e) => setFilters({ ...filters, priority_area: e.target.value })} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">All Priority Areas</option>
                {priorityAreasList.map(pa => <option key={pa.id} value={pa.id}>{pa.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive ? `bg-gradient-to-r ${tab.color} text-white` : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;