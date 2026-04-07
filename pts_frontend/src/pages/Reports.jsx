// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { Download, Filter, BarChart3, LineChart, FileText, FileSpreadsheet, File, Building2, AlertCircle, Eye, RefreshCw, TrendingUp, Target } from 'lucide-react';
import { projects, ministries } from '../services/api';
import toast from 'react-hot-toast';
import { format as formatDate } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('performance');
  const [selectedMinistry, setSelectedMinistry] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [previewData, setPreviewData] = useState(null);
  const [ministriesList, setMinistriesList] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (allProjects.length > 0) filterPreviewData(); }, [reportType, selectedMinistry, selectedYear, selectedQuarter, allProjects]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ministriesRes = await ministries.list();
      setMinistriesList(ministriesRes.data);
      const projectsRes = await projects.list();
      const projectsData = projectsRes.data.results || projectsRes.data;
      setAllProjects(projectsData);
      const years = [...new Set(projectsData.map(p => p.year))].sort((a, b) => b - a);
      setAvailableYears(years);
    } catch (error) { console.error('Error:', error); toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const filterPreviewData = () => {
    let filteredProjects = [...allProjects];
    if (selectedMinistry) {
      const ministry = ministriesList.find(m => m.id === parseInt(selectedMinistry));
      if (ministry) filteredProjects = filteredProjects.filter(p => p.ministry_title === ministry.title);
    }
    if (selectedYear) filteredProjects = filteredProjects.filter(p => p.year === parseInt(selectedYear));
    if (selectedQuarter) filteredProjects = filteredProjects.filter(p => p.quarter === parseInt(selectedQuarter));
    
    let processedData = {};
    
    if (reportType === 'performance') {
      const totalProjects = filteredProjects.length;
      const ratedProjects = filteredProjects.filter(p => p.performance_rating);
      const avgRating = ratedProjects.length > 0 ? (ratedProjects.reduce((sum, p) => sum + p.performance_rating, 0) / ratedProjects.length).toFixed(1) : 0;
      const ratingDistribution = {
        'Excellent': filteredProjects.filter(p => p.performance_rating === 5).length,
        'Very Good': filteredProjects.filter(p => p.performance_rating === 4).length,
        'Good': filteredProjects.filter(p => p.performance_rating === 3).length,
        'Fair': filteredProjects.filter(p => p.performance_rating === 2).length,
        'Poor': filteredProjects.filter(p => p.performance_rating === 1).length,
      };
      const completionRate = totalProjects > 0 ? (filteredProjects.filter(p => p.actual_data && p.target_data && p.actual_data >= p.target_data).length / totalProjects * 100).toFixed(1) : 0;
      processedData = { summary: { totalProjects, avgRating, completionRate, totalMinistries: [...new Set(filteredProjects.map(p => p.ministry_title))].length }, ratingDistribution, projects: filteredProjects.slice(0, 10) };
    } 
    else if (reportType === 'ministry') {
      const ministryData = ministriesList.map(ministry => {
        const ministryProjects = filteredProjects.filter(p => p.ministry_title === ministry.title);
        const avgRating = ministryProjects.filter(p => p.performance_rating).reduce((sum, p) => sum + p.performance_rating, 0) / (ministryProjects.filter(p => p.performance_rating).length || 1);
        return { name: ministry.title, totalProjects: ministryProjects.length, avgRating: avgRating.toFixed(1), onTrack: ministryProjects.filter(p => p.performance_rating >= 4).length };
      }).filter(m => m.totalProjects > 0);
      processedData = { ministries: ministryData };
    }
    else if (reportType === 'quarterly') {
      const quarterlyData = {};
      filteredProjects.forEach(project => {
        const key = `${project.year}-Q${project.quarter}`;
        if (!quarterlyData[key]) quarterlyData[key] = { year: project.year, quarter: project.quarter, projects: 0, totalRating: 0, ratedCount: 0 };
        quarterlyData[key].projects++;
        if (project.performance_rating) { quarterlyData[key].totalRating += project.performance_rating; quarterlyData[key].ratedCount++; }
      });
      const quarters = Object.values(quarterlyData).map(q => ({ period: `${q.year} Q${q.quarter}`, projects: q.projects, avgRating: q.ratedCount > 0 ? (q.totalRating / q.ratedCount).toFixed(1) : 0 })).sort((a, b) => a.period.localeCompare(b.period));
      processedData = { quarters };
    }
    setPreviewData(processedData);
  };

  const generatePDF = () => {
    if (!previewData) { toast.error('No data to generate'); return; }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Performance Report', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(8);
    doc.text(formatDate(new Date(), 'MMM dd, yyyy'), pageWidth / 2, 28, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    const title = reportType === 'performance' ? 'Performance Summary' : reportType === 'ministry' ? 'Ministry Performance' : 'Quarterly Analysis';
    doc.text(title, pageWidth / 2, 50, { align: 'center' });
    
    let yPosition = 60;
    if (reportType === 'performance' && previewData.summary) {
      autoTable(doc, { startY: yPosition, head: [['Metric', 'Value']], body: [['Total Projects', previewData.summary.totalProjects], ['Avg Rating', `${previewData.summary.avgRating}/5`], ['Completion', `${previewData.summary.completionRate}%`]], theme: 'striped', headStyles: { fillColor: [34, 197, 94], fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 20, right: 20 } });
      yPosition = doc.lastAutoTable.finalY + 8;
      autoTable(doc, { startY: yPosition, head: [['Rating', 'Count']], body: Object.entries(previewData.ratingDistribution), theme: 'striped', headStyles: { fillColor: [34, 197, 94], fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 20, right: 20 } });
    }
    else if (reportType === 'ministry' && previewData.ministries) {
      autoTable(doc, { startY: yPosition, head: [['Ministry', 'Projects', 'Rating']], body: previewData.ministries.map(m => [m.name, m.totalProjects, `${m.avgRating}/5`]), theme: 'striped', headStyles: { fillColor: [34, 197, 94], fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 20, right: 20 } });
    }
    else if (reportType === 'quarterly' && previewData.quarters) {
      autoTable(doc, { startY: yPosition, head: [['Period', 'Projects', 'Rating']], body: previewData.quarters.map(q => [q.period, q.projects, `${q.avgRating}/5`]), theme: 'striped', headStyles: { fillColor: [34, 197, 94], fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 20, right: 20 } });
    }
    doc.save(`${reportType}_report.pdf`);
    toast.success('PDF generated');
  };

  const generateExcel = () => {
    if (!previewData) { toast.error('No data to generate'); return; }
    let worksheetData = [];
    if (reportType === 'performance' && previewData.summary) {
      worksheetData = [['Performance Report'], ['Generated:', formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')], [], ['Metric', 'Value'], ['Total Projects', previewData.summary.totalProjects], ['Avg Rating', `${previewData.summary.avgRating}/5`], ['Completion Rate', `${previewData.summary.completionRate}%`], [], ['Rating Distribution', 'Count'], ...Object.entries(previewData.ratingDistribution)];
    }
    else if (reportType === 'ministry' && previewData.ministries) {
      worksheetData = [['Ministry Report'], ['Generated:', formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')], [], ['Ministry', 'Projects', 'Avg Rating'], ...previewData.ministries.map(m => [m.name, m.totalProjects, `${m.avgRating}/5`])];
    }
    else if (reportType === 'quarterly' && previewData.quarters) {
      worksheetData = [['Quarterly Report'], ['Generated:', formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')], [], ['Period', 'Projects', 'Avg Rating'], ...previewData.quarters.map(q => [q.period, q.projects, `${q.avgRating}/5`])];
    }
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_report.xlsx`);
    toast.success('Excel generated');
  };

  const handleGenerateReport = async () => {
    if (!previewData) { toast.error('No data available'); return; }
    setLoading(true);
    try { exportFormat === 'pdf' ? generatePDF() : generateExcel(); } 
    catch (error) { console.error('Error:', error); toast.error('Generation failed'); } 
    finally { setLoading(false); }
  };

  const resetFilters = () => { setSelectedMinistry(''); setSelectedYear(''); setSelectedQuarter(''); };

  const reportTypes = [
    { id: 'performance', name: 'Performance', icon: BarChart3, color: 'green' },
    { id: 'ministry', name: 'Ministry', icon: Building2, color: 'blue' },
    { id: 'quarterly', name: 'Quarterly', icon: LineChart, color: 'purple' }
  ];

  if (loading && allProjects.length === 0) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div><p className="text-gray-500 text-sm">Loading...</p></div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            <p className="text-xs text-gray-500 mt-0.5">Generate performance reports</p>
          </div>
          <button onClick={resetFilters} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Panel - Settings */}
        <div className="lg:col-span-1 space-y-4">
          {/* Report Type */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              Type
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {reportTypes.map(type => {
                const Icon = type.icon;
                const isSelected = reportType === type.id;
                return (
                  <button key={type.id} onClick={() => setReportType(type.id)} className={`p-2 rounded-lg text-center transition-all ${isSelected ? `bg-${type.color}-600 text-white shadow-sm` : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${isSelected ? 'text-white' : `text-${type.color}-600`}`} />
                    <span className="text-xs font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-green-600" />
              Filters
            </h3>
            <div className="space-y-3">
              <select value={selectedMinistry} onChange={(e) => setSelectedMinistry(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500">
                <option value="">All Ministries</option>
                {ministriesList.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500">
                <option value="">All Years</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} disabled={!selectedYear} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-50 focus:ring-2 focus:ring-green-500">
                <option value="">All Quarters</option>
                <option value="1">Q1</option><option value="2">Q2</option><option value="3">Q3</option><option value="4">Q4</option>
              </select>
            </div>
          </div>

          {/* Export */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-green-600" />
              Export
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => setExportFormat('pdf')} className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg text-sm border transition ${exportFormat === 'pdf' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <File className="w-3.5 h-3.5" /> PDF
              </button>
              <button onClick={() => setExportFormat('excel')} className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg text-sm border transition ${exportFormat === 'excel' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
            </div>
            <button onClick={handleGenerateReport} disabled={loading || !previewData} className="w-full py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-1.5 text-sm shadow-sm transition disabled:opacity-50">
              {loading ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>Generating...</> : <><Download className="w-3.5 h-3.5" />Generate</>}
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
              </div>
            </div>
            
            <div className="p-4">
              {!previewData ? (
                <div className="text-center py-12">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Select filters to preview</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Performance Summary */}
                  {reportType === 'performance' && previewData.summary && (
                    <>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-green-50 rounded-lg p-2 text-center"><div className="text-xl font-bold text-green-600">{previewData.summary.totalProjects}</div><div className="text-xs text-gray-600">Projects</div></div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center"><div className="text-xl font-bold text-blue-600">{previewData.summary.avgRating}/5</div><div className="text-xs text-gray-600">Rating</div></div>
                        <div className="bg-purple-50 rounded-lg p-2 text-center"><div className="text-xl font-bold text-purple-600">{previewData.summary.completionRate}%</div><div className="text-xs text-gray-600">Complete</div></div>
                        <div className="bg-orange-50 rounded-lg p-2 text-center"><div className="text-xl font-bold text-orange-600">{previewData.summary.totalMinistries}</div><div className="text-xs text-gray-600">Ministries</div></div>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Ratings</h4>
                        <div className="space-y-1.5">
                          {Object.entries(previewData.ratingDistribution).map(([rating, count]) => (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="w-16 text-xs text-gray-600">{rating}</span>
                              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${(count / previewData.summary.totalProjects) * 100}%` }} /></div>
                              <span className="text-xs font-medium text-gray-700 w-8 text-right">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {previewData.projects?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Recent Projects</h4>
                          <div className="space-y-1.5 max-h-60 overflow-y-auto">
                            {previewData.projects.slice(0, 5).map((p, i) => (
                              <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                                <span className="text-gray-700 truncate flex-1">{p.outcome}</span>
                                <span className="text-gray-500 ml-2">{p.performance_rating || '—'}/5</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Ministry Summary */}
                  {reportType === 'ministry' && previewData.ministries && (
                    <div className="space-y-2">
                      {previewData.ministries.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div><div className="text-sm font-medium text-gray-900">{m.name}</div><div className="text-xs text-gray-500">{m.totalProjects} projects</div></div>
                          <div className="text-right"><div className="text-sm font-bold text-green-600">{m.avgRating}/5</div><div className="text-xs text-gray-500">{m.onTrack} on track</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Quarterly Summary */}
                  {reportType === 'quarterly' && previewData.quarters && (
                    <div className="space-y-2">
                      {previewData.quarters.map((q, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div><div className="text-sm font-medium text-gray-900">{q.period}</div><div className="text-xs text-gray-500">{q.projects} projects</div></div>
                          <div className="text-sm font-bold text-green-600">{q.avgRating}/5</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-blue-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Preview shows limited data. Generate full report for complete details.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;