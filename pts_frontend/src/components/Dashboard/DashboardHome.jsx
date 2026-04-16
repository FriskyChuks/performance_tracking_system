// src/components/Dashboard/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Target, CheckCircle, Building2, Layers, Package,
  Eye, Download, RefreshCw, Plus, Calendar, ArrowUp, Landmark, Briefcase,
  Award, Zap, Activity, Clock
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import reportsApi from '../../services/reportsApi';
import { useAuth } from '../../hooks/useAuth';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role;
  const isAdmin = userRole === 'super_admin' || userRole === 'project_admin';
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentInitiatives, setRecentInitiatives] = useState([]);
  const [quarterlyData, setQuarterlyData] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [agencyPerformance, setAgencyPerformance] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [initiativeType, setInitiativeType] = useState('all');
  
  // Separate stats for counts
  const [countStats, setCountStats] = useState({
    totalDepartments: 0,
    totalAgencies: 0,
    totalPriorityAreas: 0,
    totalDeliverables: 0
  });

  // Destructure mainApi for easier access
  const { initiatives, departments, agencies, priorityAreas, deliverables } = mainApi;

  useEffect(() => { 
    fetchCounts();
    fetchDashboardData(); 
  }, [selectedYear, initiativeType]);

  const fetchCounts = async () => {
    try {
      // Fetch counts directly from the APIs
      const [deptRes, agencyRes, priorityRes, deliverableRes] = await Promise.all([
        departments.list(),
        agencies.list(),
        priorityAreas.list(),
        deliverables.list()
      ]);
      
      setCountStats({
        totalDepartments: deptRes.data.length,
        totalAgencies: agencyRes.data.length,
        totalPriorityAreas: priorityRes.data.length,
        totalDeliverables: deliverableRes.data.length
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch summary report data
      const summaryRes = await reportsApi.getReportData('summary', { year: selectedYear });
      const summaryData = summaryRes.data;
      
      // Fetch department performance
      const deptRes = await reportsApi.getReportData('department', { year: selectedYear });
      const deptData = deptRes.data;
      
      // Fetch agency performance
      const agencyRes = await reportsApi.getReportData('agency', { year: selectedYear });
      const agencyData = agencyRes.data;
      
      // Fetch quarterly data
      const quarterlyRes = await reportsApi.getReportData('quarterly', { year: selectedYear });
      const quarterlyReportData = quarterlyRes.data;
      
      // Fetch recent initiatives
      const initiativesRes = await initiatives.list({ ordering: '-created_at' });
      let allInitiatives = initiativesRes.data.results || initiativesRes.data;
      
      if (initiativeType !== 'all') {
        allInitiatives = allInitiatives.filter(i => i.initiative_type === initiativeType);
      }
      
      // Process quarterly data for chart
      const quarterChartData = (quarterlyReportData || []).map(q => ({
        quarter: q.name,
        initiatives: q.initiative_count || 0,
        avgRating: q.avg_achievement?.toFixed(1) || 0,
      }));
      setQuarterlyData(quarterChartData);
      
      // Process department data for chart
      const deptChartData = (deptData || []).slice(0, 6).map(d => ({
        name: d.name.length > 12 ? d.name.substring(0, 10) + '..' : d.name,
        fullName: d.name,
        avgRating: d.avg_achievement?.toFixed(1) || 0,
        initiatives: d.initiative_count || 0
      }));
      setDepartmentPerformance(deptChartData);
      
      // Process agency data for chart
      const agencyChartData = (agencyData || []).slice(0, 6).map(a => ({
        name: a.name.length > 12 ? a.name.substring(0, 10) + '..' : a.name,
        fullName: a.name,
        avgRating: a.avg_achievement?.toFixed(1) || 0,
        initiatives: a.initiative_count || 0
      }));
      setAgencyPerformance(agencyChartData);
      
      // Get available years
      const years = [...new Set(allInitiatives.map(i => new Date(i.start_date).getFullYear()))].sort((a, b) => b - a);
      setAvailableYears(years);
      
      // Set recent initiatives
      setRecentInitiatives(allInitiatives.slice(0, 5));
      
      // Set stats from summary data
      setStats({
        totalInitiatives: summaryData.summary?.total_initiatives || 0,
        totalProjects: summaryData.summary?.total_projects || 0,
        totalPrograms: summaryData.summary?.total_programs || 0,
        avgRating: summaryData.summary?.avg_rating?.toFixed(1) || 0,
        completionRate: summaryData.summary?.completion_rate?.toFixed(0) || 0,
        ratingDistribution: Object.entries(summaryData.rating_distribution || {}).map(([name, value]) => ({ name, value })),
        quarterlyTrend: summaryData.quarterly_trend || []
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally { 
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Departments', value: countStats.totalDepartments || 0, icon: Building2, color: 'blue' },
    { title: 'Agencies', value: countStats.totalAgencies || 0, icon: Landmark, color: 'cyan' },
    { title: 'Priority Areas', value: countStats.totalPriorityAreas || 0, icon: Layers, color: 'purple' },
    { title: 'Deliverables', value: countStats.totalDeliverables || 0, icon: Package, color: 'emerald' },
    { title: 'Initiatives', value: stats?.totalInitiatives || 0, icon: TrendingUp, color: 'orange' },
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
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Welcome Back! 👋</h2>
              <p className="text-green-100 text-xs mt-0.5">Federal Ministry of Environment - Performance Dashboard</p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Link to="/dashboard/initiatives/new" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1">
                  <Plus className="w-3 h-3" /> New Initiative
                </Link>
              )}
              <button onClick={fetchDashboardData} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 rounded-lg transition">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Initiative Type Toggle */}
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => setInitiativeType('all')}
              className={`text-xs px-2 py-1 rounded-lg transition ${initiativeType === 'all' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
            >
              All ({stats?.totalInitiatives || 0})
            </button>
            <button 
              onClick={() => setInitiativeType('project')}
              className={`text-xs px-2 py-1 rounded-lg transition ${initiativeType === 'project' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
            >
              Projects ({stats?.totalProjects || 0})
            </button>
            <button 
              onClick={() => setInitiativeType('program')}
              className={`text-xs px-2 py-1 rounded-lg transition ${initiativeType === 'program' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
            >
              Programs ({stats?.totalPrograms || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
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
                Quarterly Performance Trend
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
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Area type="monotone" dataKey="avgRating" stroke="#22c55e" fillOpacity={1} fill="url(#colorRating)" name="Achievement %" />
              <Bar dataKey="initiatives" fill="#eab308" radius={[2, 2, 0, 0]} name="Initiatives" opacity={0.6} />
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

      {/* Department Performance */}
      {departmentPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-green-600" />
            Department Rankings
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={departmentPerformance} layout="vertical" margin={{ left: 70, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(value) => [`${value}%`, 'Achievement']} labelFormatter={(label) => departmentPerformance.find(d => d.name === label)?.fullName || label} />
              <Bar dataKey="avgRating" fill="#22c55e" radius={[0, 4, 4, 0]} name="Achievement %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Agency Performance */}
      {agencyPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-green-600" />
            Agency Rankings
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={agencyPerformance} layout="vertical" margin={{ left: 70, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(value) => [`${value}%`, 'Achievement']} labelFormatter={(label) => agencyPerformance.find(a => a.name === label)?.fullName || label} />
              <Bar dataKey="avgRating" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Achievement %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Initiatives */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-900">Recent Initiatives</h3>
          </div>
          <Link to="/dashboard/initiatives" className="text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1">
            View All <Eye className="w-3 h-3" />
          </Link>
        </div>
        {recentInitiatives.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs">
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden md:table-cell">Type</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden lg:table-cell">Department/Agency</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Timeline</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden lg:table-cell">Target</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden lg:table-cell">Actual</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Rating</th>
                </tr>
              </thead>
              <tbody>
                {recentInitiatives.map((initiative, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/dashboard/initiatives/${initiative.id}`)}>
                    <td className="py-2 px-3">
                      <div className="font-medium text-gray-900 text-xs line-clamp-1">{initiative.title}</div>
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-xs hidden md:table-cell">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${initiative.initiative_type === 'project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {initiative.initiative_type === 'project' ? 'Project' : 'Program'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-xs hidden lg:table-cell">{initiative.department_name || initiative.agency_name || '-'}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs">{new Date(initiative.start_date).getFullYear()} • Q{Math.ceil(new Date(initiative.start_date).getMonth() / 3) + 1}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs hidden lg:table-cell">{initiative.target_value || '-'} {initiative.unit_of_measure || ''}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs hidden lg:table-cell">{initiative.actual_value || '-'} {initiative.unit_of_measure || ''}</td>
                    <td className="py-2 px-3">
                      {initiative.performance_rating ? (
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${getRatingColor(initiative.performance_rating)}`}>
                          {initiative.performance_rating}/5
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
            <p className="text-gray-500 text-sm">No initiatives yet</p>
            {isAdmin && (
              <Link to="/dashboard/initiatives/new" className="inline-flex items-center gap-1 text-green-600 text-xs mt-2">
                <Plus className="w-3 h-3" /> Create first initiative
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {isAdmin && (
          <Link to="/dashboard/initiatives/new" className="bg-green-50 rounded-lg p-3 border border-green-200 hover:shadow-sm transition group">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-1.5 rounded-lg"><Plus className="w-3.5 h-3.5 text-white" /></div>
              <div><h4 className="font-semibold text-gray-900 text-xs">New Initiative</h4><p className="text-gray-500 text-xs hidden sm:block">Add project/program</p></div>
            </div>
          </Link>
        )}
        
        <Link to="/dashboard/reports" className="bg-blue-50 rounded-lg p-3 border border-blue-200 hover:shadow-sm transition group">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Download className="w-3.5 h-3.5 text-white" /></div>
            <div><h4 className="font-semibold text-gray-900 text-xs">Reports</h4><p className="text-gray-500 text-xs hidden sm:block">Export data</p></div>
          </div>
        </Link>
        
        <Link to="/dashboard/departments" className="bg-purple-50 rounded-lg p-3 border border-purple-200 hover:shadow-sm transition group">
          <div className="flex items-center gap-2">
            <div className="bg-purple-600 p-1.5 rounded-lg"><Building2 className="w-3.5 h-3.5 text-white" /></div>
            <div><h4 className="font-semibold text-gray-900 text-xs">Hierarchy</h4><p className="text-gray-500 text-xs hidden sm:block">Manage structure</p></div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardHome;