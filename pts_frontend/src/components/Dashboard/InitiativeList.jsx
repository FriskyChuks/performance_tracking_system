// src/components/Dashboard/InitiativeList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import accountsApi from '../../services/accountsApi';
import mainApi from '../../services/mainApi';
import { 
  Plus, Search, Filter, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, Download, TrendingUp,
  Calendar, Building2, Landmark, X, AlertCircle, ArrowUpDown,
  Grid3x3, List, RefreshCw, CheckCircle, Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const InitiativeList = ({ viewMode: externalViewMode, setViewMode: externalSetViewMode }) => {
  const { user } = useAuth();
  const [internalViewMode, setInternalViewMode] = useState('grid');
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setViewMode = externalSetViewMode || setInternalViewMode;
  const navigate = useNavigate();
  const [initiativeList, setInitiativeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInitiatives, setSelectedInitiatives] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'start_date', direction: 'desc' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [initiativeToDelete, setInitiativeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  const [filters, setFilters] = useState({
    department: '', agency: '', priority_area: '', deliverable: '',
    initiative_type: '', status: '', performance_rating: '',
    date_from: '', date_to: ''
  });
  
  const [departmentsList, setDepartmentsList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [priorityAreasList, setPriorityAreasList] = useState([]);
  const [deliverablesList, setDeliverablesList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  // Role-based permissions
  const userRole = user?.role;
  const isSuperAdmin = user?.is_superuser;
  const canEdit = userRole === 'project_admin' || userRole === 'super_admin' || userRole === 'staff';
  const canDelete = userRole === 'project_admin' || userRole === 'super_admin';
  const canCreate = userRole === 'project_admin' || userRole === 'super_admin';

  // Destructure mainApi for easier access
  const { departments, agencies, priorityAreas, deliverables, initiatives } = mainApi;

  useEffect(() => { fetchDropdownData(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  useEffect(() => { fetchInitiatives(); }, [currentPage, filters, debouncedSearch, sortConfig]);
  useEffect(() => {
    if (filters.priority_area) fetchDeliverables();
    else { setDeliverablesList([]); setFilters(prev => ({ ...prev, deliverable: '' })); }
  }, [filters.priority_area]);

  const fetchDropdownData = async () => {
    try {
      const [departmentsRes, agenciesRes, priorityAreasRes] = await Promise.all([
        departments.list(),
        agencies.list(),
        priorityAreas.list()
      ]);
      setDepartmentsList(departmentsRes.data);
      setAgenciesList(agenciesRes.data);
      setPriorityAreasList(priorityAreasRes.data);
    } catch (error) { console.error('Error fetching dropdown data:', error); }
  };

  const fetchDeliverables = async () => {
    if (!filters.priority_area) return;
    try {
      const response = await deliverables.list({ priority_area: filters.priority_area });
      setDeliverablesList(response.data);
    } catch (error) { console.error('Error fetching deliverables:', error); }
  };

  const fetchInitiatives = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch, ...filters,
        ordering: `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}`
      };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      const response = await initiatives.list(params);
      setInitiativeList(response.data.results || response.data);
      setTotalPages(Math.ceil((response.data.count || response.data.length) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching initiatives:', error);
      toast.error('Failed to fetch initiatives');
    } finally { setLoading(false); }
  };

  const handleSort = (key) => setSortConfig(prev => ({
    key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
  }));

  const handleSelectAll = () => {
    if (selectedInitiatives.length === currentItems.length) setSelectedInitiatives([]);
    else setSelectedInitiatives(currentItems.map(i => i.id));
  };

  const handleSelectInitiative = (id) => setSelectedInitiatives(prev =>
    prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
  );

  const handleDeleteClick = (initiative) => { setInitiativeToDelete(initiative); setShowDeleteModal(true); };
  
  const handleConfirmDelete = async () => {
    if (!initiativeToDelete) return;
    setIsDeleting(true);
    try {
      await initiatives.delete(initiativeToDelete.id);
      await accountsApi.logActivity({ 
        action: 'initiative_deleted', 
        description: `Deleted initiative: ${initiativeToDelete.title}` 
      });
      toast.success('Initiative deleted');
      setShowDeleteModal(false);
      setSelectedInitiatives(prev => prev.filter(id => id !== initiativeToDelete.id));
      fetchInitiatives();
    } catch (error) { 
      toast.error('Failed to delete'); 
    } finally { 
      setIsDeleting(false); 
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedInitiatives.length === 0) return toast.error('No initiatives selected');
    setShowBulkDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(selectedInitiatives.map(id => initiatives.delete(id)));
      toast.success(`${selectedInitiatives.length} initiatives deleted`);
      setSelectedInitiatives([]);
      setShowBulkDeleteModal(false);
      fetchInitiatives();
    } catch (error) { 
      toast.error('Failed to delete'); 
    } finally { 
      setIsDeleting(false); 
    }
  };

  const handleExport = async () => {
    try {
      const params = { search: debouncedSearch, ...filters, format: 'csv' };
      const response = await initiatives.export(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `initiatives_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started');
    } catch (error) { 
      toast.error('Export failed'); 
    }
  };

  const resetFilters = () => {
    setFilters({ department: '', agency: '', priority_area: '', deliverable: '', initiative_type: '', status: '', performance_rating: '', date_from: '', date_to: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getRatingBadge = (rating) => {
    const config = {
      5: { color: 'bg-green-600', label: 'Excellent', icon: '🏆' },
      4: { color: 'bg-emerald-500', label: 'Very Good', icon: '⭐' },
      3: { color: 'bg-yellow-500', label: 'Good', icon: '👍' },
      2: { color: 'bg-orange-500', label: 'Fair', icon: '⚠️' },
      1: { color: 'bg-red-500', label: 'Poor', icon: '🔴' }
    };
    const c = config[rating];
    if (!c) return null;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${c.color} text-white text-xs font-medium shadow-sm`}>
        <span>{c.icon}</span>
        <span className="hidden sm:inline">{c.label}</span>
      </div>
    );
  };

  const getTypeBadge = (type) => {
    if (type === 'project') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">📋 Project</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium">📊 Program</span>;
  };

  const getStatusBadge = (status) => {
    const config = {
      'planning': { color: 'bg-gray-100 text-gray-700', icon: '📝' },
      'ongoing': { color: 'bg-blue-100 text-blue-700', icon: '🔄' },
      'completed': { color: 'bg-green-100 text-green-700', icon: '✅' },
      'on_hold': { color: 'bg-yellow-100 text-yellow-700', icon: '⏸️' },
      'cancelled': { color: 'bg-red-100 text-red-700', icon: '❌' }
    };
    const c = config[status] || config.planning;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${c.color} text-xs font-medium`}>{c.icon} {status.replace('_', ' ')}</span>;
  };

  const getActiveFilterCount = () => Object.values(filters).filter(v => v && v !== '').length;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = initiativeList.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading initiatives...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-lg shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Initiatives</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Track and manage projects & programs</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedInitiatives.length > 0 && canDelete && (
              <button onClick={handleBulkDeleteClick} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 text-sm shadow-sm transition">
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete ({selectedInitiatives.length})</span>
              </button>
            )}
            <button onClick={handleExport} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5 text-sm">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            {canCreate && (
              <Link to="/dashboard/initiatives/new" className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1.5 text-sm shadow-sm transition">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New</span>
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search initiatives by title, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm transition ${showFilters || getActiveFilterCount() > 0 ? 'bg-green-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {getActiveFilterCount() > 0 && <span className="ml-0.5 bg-white text-green-600 rounded-full w-4 h-4 text-xs flex items-center justify-center">{getActiveFilterCount()}</span>}
            </button>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <button onClick={resetFilters} className="p-2 text-gray-500 hover:text-gray-700 transition" title="Reset filters">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">Department</option>
                {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              
              <select value={filters.agency} onChange={(e) => setFilters({ ...filters, agency: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">Agency</option>
                {agenciesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              
              <select value={filters.priority_area} onChange={(e) => setFilters({ ...filters, priority_area: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">Priority Area</option>
                {priorityAreasList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              
              <select value={filters.deliverable} onChange={(e) => setFilters({ ...filters, deliverable: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-50" disabled={!filters.priority_area}>
                <option value="">Deliverable</option>
                {deliverablesList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              
              <select value={filters.initiative_type} onChange={(e) => setFilters({ ...filters, initiative_type: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">Type</option>
                <option value="project">Project</option>
                <option value="program">Program</option>
              </select>
              
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">Status</option>
                <option value="planning">Planning</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select value={filters.performance_rating} onChange={(e) => setFilters({ ...filters, performance_rating: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">Rating</option>
                <option value="5">Excellent</option>
                <option value="4">Very Good</option>
                <option value="3">Good</option>
                <option value="2">Fair</option>
                <option value="1">Poor</option>
              </select>
            </div>
            
            {getActiveFilterCount() > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-1.5">
                {Object.entries(filters).map(([key, value]) => value && (
                  <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs">
                    {key.replace('_', ' ')}: {typeof value === 'string' && value.length > 20 ? value.substring(0, 20) + '...' : value}
                    <button onClick={() => setFilters({ ...filters, [key]: '' })} className="hover:text-green-900"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Initiative Content */}
      {currentItems.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">No initiatives found</h3>
          <p className="text-sm text-gray-500 mb-3">Adjust filters or create a new initiative</p>
          {canCreate && (
            <Link to="/dashboard/initiatives/new" className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm shadow-sm hover:bg-green-700 transition">
              <Plus className="w-3.5 h-3.5" /> New Initiative
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentItems.map((initiative) => (
            <div key={initiative.id} className={`group bg-white rounded-xl border transition-all hover:shadow-md cursor-pointer ${selectedInitiatives.includes(initiative.id) ? 'border-green-500 shadow-md ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => navigate(`/dashboard/initiatives/${initiative.id}`)}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      {getTypeBadge(initiative.initiative_type)}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{initiative.title}</h3>
                  </div>
                  {canDelete && (
                    <input type="checkbox" checked={selectedInitiatives.includes(initiative.id)} onChange={(e) => { e.stopPropagation(); handleSelectInitiative(initiative.id); }} className="ml-2 w-3.5 h-3.5 text-green-600 rounded border-gray-300 focus:ring-green-500" onClick={(e) => e.stopPropagation()} />
                  )}
                </div>
                
                <div className="space-y-1.5 mb-3">
                  {initiative.department_name && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{initiative.department_name}</span>
                    </div>
                  )}
                  {initiative.agency_name && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Landmark className="w-3 h-3" />
                      <span className="truncate">{initiative.agency_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>Start: {new Date(initiative.start_date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  {getRatingBadge(initiative.performance_rating)}
                  {canEdit && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/initiatives/${initiative.id}/edit`); }} className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition"><Edit className="w-3 h-3" /></button>
                      {canDelete && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(initiative); }} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="w-3 h-3" /></button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {canDelete && (
                    <th className="w-8 py-2 px-3"><input type="checkbox" checked={selectedInitiatives.length === currentItems.length && currentItems.length > 0} onChange={handleSelectAll} className="w-3.5 h-3.5 text-green-600 rounded" /></th>
                  )}
                  <th className="text-left py-2 px-3"><button onClick={() => handleSort('title')} className="flex items-center gap-1 text-xs font-semibold text-gray-700">Title <ArrowUpDown className="w-3 h-3" /></button></th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 hidden md:table-cell">Department/Agency</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 hidden lg:table-cell">Start Date</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Rating</th>
                  {canEdit && (
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((initiative) => (
                  <tr key={initiative.id} className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/dashboard/initiatives/${initiative.id}`)}>
                    {canDelete && (
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedInitiatives.includes(initiative.id)} onChange={() => handleSelectInitiative(initiative.id)} className="w-3.5 h-3.5 text-green-600 rounded" /></td>
                    )}
                    <td className="py-2 px-3"><div className="font-medium text-gray-900 truncate max-w-xs">{initiative.title}</div><div className="text-xs text-gray-500 truncate">{initiative.code || ''}</div></td>
                    <td className="py-2 px-3">{getTypeBadge(initiative.initiative_type)}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs hidden md:table-cell">{initiative.department_name || initiative.agency_name || '-'}</td>
                    <td className="py-2 px-3">{getStatusBadge(initiative.status)}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs hidden lg:table-cell">{new Date(initiative.start_date).toLocaleDateString()}</td>
                    <td className="py-2 px-3">{getRatingBadge(initiative.performance_rating)}</td>
                    {canEdit && (
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1.5">
                          <button onClick={() => navigate(`/dashboard/initiatives/${initiative.id}`)} className="p-1 text-gray-500 hover:text-green-600 transition" title="View"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => navigate(`/dashboard/initiatives/${initiative.id}/edit`)} className="p-1 text-gray-500 hover:text-blue-600 transition" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                          {canDelete && (
                            <button onClick={() => handleDeleteClick(initiative)} className="p-1 text-gray-500 hover:text-red-600 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-gray-500">Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, initiativeList.length)} of {initiativeList.length}</div>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 text-gray-600 hover:text-green-600 disabled:opacity-50 transition"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-7 h-7 rounded-lg text-sm transition ${currentPage === pageNum ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{pageNum}</button>;
            })}
            <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 text-gray-600 hover:text-green-600 disabled:opacity-50 transition"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Delete Modals - Only shown if user can delete */}
      {canDelete && showDeleteModal && initiativeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-3">
              <div className="flex items-center gap-2"><div className="bg-white/20 p-1.5 rounded-lg"><AlertCircle className="w-4 h-4 text-white" /></div><h3 className="text-base font-bold text-white">Delete Initiative</h3></div>
            </div>
            <div className="p-5">
              <p className="text-gray-700 text-sm mb-2">Delete <span className="font-semibold">"{initiativeToDelete.title}"</span>?</p>
              <p className="text-xs text-gray-500 mb-5">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button>
                <button onClick={handleConfirmDelete} disabled={isDeleting} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 text-sm shadow-sm">{isDeleting ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>Deleting...</> : <><Trash2 className="w-3.5 h-3.5" />Delete</>}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canDelete && showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-3"><div className="flex items-center gap-2"><div className="bg-white/20 p-1.5 rounded-lg"><AlertCircle className="w-4 h-4 text-white" /></div><h3 className="text-base font-bold text-white">Bulk Delete</h3></div></div>
            <div className="p-5">
              <p className="text-gray-700 text-sm mb-2">Delete <span className="font-semibold">{selectedInitiatives.length}</span> initiatives?</p>
              <p className="text-xs text-gray-500 mb-5">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowBulkDeleteModal(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button>
                <button onClick={handleConfirmBulkDelete} disabled={isDeleting} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 text-sm shadow-sm">{isDeleting ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>Deleting...</> : <><Trash2 className="w-3.5 h-3.5" />Delete All</>}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InitiativeList;