// src/components/Dashboard/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Target, CheckCircle, Building2, Layers, Package,
  Eye, Download, RefreshCw, Plus, Calendar, ArrowUp
} from 'lucide-react';
import { projects, ministries, priorityAreas, deliverables } from '../../services/api';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentProjects, setRecentProjects] = useState([]);
  const [quarterlyData, setQuarterlyData] = useState([]);
  const [yearlyTrend, setYearlyTrend] = useState([]);
  const [ministryPerformance, setMinistryPerformance] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => { fetchDashboardData(); }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const projectsRes = await projects.list();
      const allProjects = projectsRes.data.results || projectsRes.data;
      
      const ministriesRes = await ministries.list();
      const priorityAreasRes = await priorityAreas.list();
      const deliverablesRes = await deliverables.list();
      
      const totalMinistries = ministriesRes.data.length;
      const totalPriorityAreas = priorityAreasRes.data.length;
      const totalDeliverables = deliverablesRes.data.length;
      const totalProjects = allProjects.length;
      
      const ratedProjects = allProjects.filter(p => p.performance_rating);
      const avgRating = ratedProjects.length > 0 
        ? (ratedProjects.reduce((sum, p) => sum + p.performance_rating, 0) / ratedProjects.length).toFixed(1)
        : 0;
      
      const completedProjects = allProjects.filter(p => p.actual_data && p.target_data && p.actual_data >= p.target_data);
      const completionRate = totalProjects > 0 ? ((completedProjects.length / totalProjects) * 100).toFixed(0) : 0;
      
      const recent = [...allProjects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      setRecentProjects(recent);
      
      const years = [...new Set(allProjects.map(p => p.year))].sort((a, b) => b - a);
      setAvailableYears(years);
      
      const projectsByYear = allProjects.filter(p => p.year === selectedYear);
      const quarterData = [1, 2, 3, 4].map(quarter => {
        const quarterProjects = projectsByYear.filter(p => p.quarter === quarter);
        const avgRating = quarterProjects.filter(p => p.performance_rating)
          .reduce((sum, p) => sum + p.performance_rating, 0) / (quarterProjects.filter(p => p.performance_rating).length || 1);
        return {
          quarter: `Q${quarter}`,
          projects: quarterProjects.length,
          avgRating: parseFloat(avgRating).toFixed(1),
        };
      });
      setQuarterlyData(quarterData);
      
      const ministryData = ministriesRes.data.map(ministry => {
        const ministryProjects = allProjects.filter(p => p.ministry_title === ministry.title);
        const avgRating = ministryProjects.filter(p => p.performance_rating)
          .reduce((sum, p) => sum + p.performance_rating, 0) / (ministryProjects.filter(p => p.performance_rating).length || 1);
        return {
          name: ministry.title.length > 12 ? ministry.title.substring(0, 10) + '..' : ministry.title,
          fullName: ministry.title,
          avgRating: parseFloat(avgRating).toFixed(1),
          projects: ministryProjects.length
        };
      });
      setMinistryPerformance(ministryData.sort((a, b) => b.avgRating - a.avgRating).slice(0, 8));
      
      const ratingDistribution = [
        { name: 'Excel', value: allProjects.filter(p => p.performance_rating === 5).length, color: '#22c55e' },
        { name: 'V.Good', value: allProjects.filter(p => p.performance_rating === 4).length, color: '#10b981' },
        { name: 'Good', value: allProjects.filter(p => p.performance_rating === 3).length, color: '#eab308' },
        { name: 'Fair', value: allProjects.filter(p => p.performance_rating === 2).length, color: '#f97316' },
        { name: 'Poor', value: allProjects.filter(p => p.performance_rating === 1).length, color: '#ef4444' },
      ];
      
      setStats({
        totalMinistries, totalPriorityAreas, totalDeliverables,
        totalProjects, avgRating, completionRate, ratingDistribution
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard');
    } finally { setLoading(false); }
  };

  const statCards = [
    { title: 'Ministries', value: stats?.totalMinistries || 0, icon: Building2, color: 'blue' },
    { title: 'Priority Areas', value: stats?.totalPriorityAreas || 0, icon: Layers, color: 'purple' },
    { title: 'Deliverables', value: stats?.totalDeliverables || 0, icon: Package, color: 'emerald' },
    { title: 'Projects', value: stats?.totalProjects || 0, icon: TrendingUp, color: 'orange' },
    { title: 'Avg Rating', value: stats?.avgRating || 0, suffix: '/5', icon: Target, color: 'green' },
    { title: 'Completion', value: stats?.completionRate || 0, suffix: '%', icon: CheckCircle, color: 'teal' }
  ];

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-700 bg-green-100';
    if (rating >= 3) return 'text-yellow-700 bg-yellow-100';
    if (rating >= 2) return 'text-orange-700 bg-orange-100';
    return 'text-red-700 bg-red-100';
  };

  const COLORS = ['#22c55e', '#10b981', '#eab308', '#f97316', '#ef4444'];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 text-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Welcome Back! 👋</h2>
              <p className="text-green-100 text-xs mt-0.5">Your performance tracking summary</p>
            </div>
            <div className="flex gap-2">
              <Link to="/dashboard/projects/new" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1">
                <Plus className="w-3 h-3" /> New
              </Link>
              <button onClick={fetchDashboardData} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 rounded-lg transition">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Compact 6 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className={`bg-${stat.color}-100 p-1.5 rounded-lg`}>
                  <Icon className={`w-3.5 h-3.5 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {stat.value}{stat.suffix && <span className="text-xs text-gray-500 ml-0.5">{stat.suffix}</span>}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                Quarterly Trend
              </h3>
            </div>
            {availableYears.length > 0 && (
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={quarterlyData}>
              <defs>
                <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Area type="monotone" dataKey="avgRating" stroke="#22c55e" fillOpacity={1} fill="url(#colorRating)" name="Avg Rating" />
              <Bar dataKey="projects" fill="#eab308" radius={[2, 2, 0, 0]} name="Projects" opacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-green-600" />
            Rating Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats?.ratingDistribution || []} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {(stats?.ratingDistribution || []).map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ministry Performance */}
      {ministryPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-green-600" />
            Ministry Rankings
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ministryPerformance} layout="vertical" margin={{ left: 70, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(value) => [`${value}/5`, 'Rating']} labelFormatter={(label) => ministryPerformance.find(m => m.name === label)?.fullName || label} />
              <Bar dataKey="avgRating" fill="#22c55e" radius={[0, 4, 4, 0]} name="Avg Rating" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Projects */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-900">Recent Projects</h3>
          </div>
          <Link to="/dashboard/projects" className="text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1">
            View All <Eye className="w-3 h-3" />
          </Link>
        </div>
        {recentProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs">
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Project</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden md:table-cell">Ministry</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Period</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden lg:table-cell">Target</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden lg:table-cell">Actual</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Rating</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/dashboard/projects/${project.id}`)}>
                    <td className="py-2 px-3">
                      <div className="font-medium text-gray-900 text-xs line-clamp-1">{project.outcome}</div>
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-xs hidden md:table-cell">{project.ministry_title || '-'}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs">{project.year} • Q{project.quarter}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs hidden lg:table-cell">{project.target_data || '-'}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs hidden lg:table-cell">{project.actual_data || '-'}</td>
                    <td className="py-2 px-3">
                      {project.performance_rating ? (
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${getRatingColor(project.performance_rating)}`}>
                          {project.performance_rating}/5
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500 text-sm">No projects yet</p>
            <Link to="/dashboard/projects/new" className="inline-flex items-center gap-1 text-green-600 text-xs mt-2">
              <Plus className="w-3 h-3" /> Create first project
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/dashboard/projects/new" className="bg-green-50 rounded-lg p-3 border border-green-200 hover:shadow-sm transition group">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-1.5 rounded-lg"><Plus className="w-3.5 h-3.5 text-white" /></div>
            <div><h4 className="font-semibold text-gray-900 text-xs">New Project</h4><p className="text-gray-500 text-xs hidden sm:block">Add project</p></div>
          </div>
        </Link>
        
        <Link to="/dashboard/reports" className="bg-blue-50 rounded-lg p-3 border border-blue-200 hover:shadow-sm transition group">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Download className="w-3.5 h-3.5 text-white" /></div>
            <div><h4 className="font-semibold text-gray-900 text-xs">Reports</h4><p className="text-gray-500 text-xs hidden sm:block">Export data</p></div>
          </div>
        </Link>
        
        <Link to="/dashboard/ministries" className="bg-purple-50 rounded-lg p-3 border border-purple-200 hover:shadow-sm transition group">
          <div className="flex items-center gap-2">
            <div className="bg-purple-600 p-1.5 rounded-lg"><Building2 className="w-3.5 h-3.5 text-white" /></div>
            <div><h4 className="font-semibold text-gray-900 text-xs">Hierarchy</h4><p className="text-gray-500 text-xs hidden sm:block">Manage</p></div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardHome;