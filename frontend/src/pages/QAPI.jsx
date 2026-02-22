import { API_URL, WS_URL } from '../config.js';
import { useEffect, useState } from 'react'
import {
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  X,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Download,
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'


const severityColors = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-sage-100 text-sage-700 border-sage-200',
}

const statusColors = {
  open: 'bg-red-100 text-red-700',
  investigating: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-sage-100 text-sage-700',
  closed: 'bg-warm-100 text-warm-600',
}

const statusIcons = {
  open: AlertCircle,
  investigating: Search,
  resolved: CheckCircle2,
  closed: CheckCircle2,
}

export default function QAPI() {
  const [incidents, setIncidents] = useState([])
  const [summary, setSummary] = useState({ byStatus: [], bySeverity: [], recent: [] })
  const [trends, setTrends] = useState({ trends: [], avgResolutionDays: null })
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showTrends, setShowTrends] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [incidentsRes, summaryRes, trendsRes] = await Promise.all([
        fetch(`${API_URL}/qapi`),
        fetch(`${API_URL}/qapi/summary`),
        fetch(`${API_URL}/qapi/trends?days=180`)
      ])
      const [incidentsData, summaryData, trendsData] = await Promise.all([
        incidentsRes.json(),
        summaryRes.json(),
        trendsRes.json()
      ])
      setIncidents(incidentsData)
      setSummary(summaryData)
      setTrends(trendsData)
    } catch (err) {
      console.error('Failed to fetch QAPI data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusCount = (status) => {
    return summary.byStatus?.find(s => s.status === status)?.count || 0
  }

  const filteredIncidents = filter === 'all' 
    ? incidents 
    : incidents.filter(i => i.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-warm-800">Quality Assurance</h1>
          <p className="text-warm-500 mt-1">Track incidents and continuous improvement</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter('open')}
          className={`card cursor-pointer transition-all ${filter === 'open' ? 'ring-2 ring-sage-400' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Open</p>
              <p className="text-2xl font-semibold text-red-500">{getStatusCount('open')}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter('investigating')}
          className={`card cursor-pointer transition-all ${filter === 'investigating' ? 'ring-2 ring-sage-400' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Investigating</p>
              <p className="text-2xl font-semibold text-yellow-600">{getStatusCount('investigating')}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter('resolved')}
          className={`card cursor-pointer transition-all ${filter === 'resolved' ? 'ring-2 ring-sage-400' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Resolved</p>
              <p className="text-2xl font-semibold text-sage-600">{getStatusCount('resolved')}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sage-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-sage-500" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter('all')}
          className={`card cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-sage-400' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Total</p>
              <p className="text-2xl font-semibold text-warm-800">{incidents.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cream-200 flex items-center justify-center">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-warm-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Trends Section */}
      <div className="card">
        <button
          onClick={() => setShowTrends(!showTrends)}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="font-semibold text-warm-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sage-500" />
            Incident Trends
          </h2>
          {showTrends ? <ChevronUp className="w-5 h-5 text-warm-400" /> : <ChevronDown className="w-5 h-5 text-warm-400" />}
        </button>
        
        {showTrends && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-cream-50">
                <p className="text-sm text-warm-500">Avg Resolution Time</p>
                <p className="text-2xl font-semibold text-warm-800">
                  {trends.avgResolutionDays ? `${trends.avgResolutionDays} days` : 'N/A'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-cream-50">
                <p className="text-sm text-warm-500">Total This Period</p>
                <p className="text-2xl font-semibold text-warm-800">
                  {trends.trends?.reduce((sum, t) => sum + t.total, 0) || 0}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-sage-50">
                <p className="text-sm text-warm-500">Resolution Rate</p>
                <p className="text-2xl font-semibold text-sage-600">
                  {trends.trends?.length > 0 
                    ? `${Math.round(
                        (trends.trends.reduce((sum, t) => sum + t.resolved, 0) / 
                         trends.trends.reduce((sum, t) => sum + t.total, 0)) * 100
                      )}%`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>

            {/* Monthly Incidents Chart */}
            {trends.trends?.length > 0 && (
              <div>
                <h3 className="text-sm text-warm-500 mb-3">Monthly Incidents (Last 6 Months)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => {
                          const [year, month] = val.split('-')
                          return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' })
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value, name) => [value, name === 'total' ? 'Total' : name === 'resolved' ? 'Resolved' : name === 'critical' ? 'Critical' : 'High']}
                        labelFormatter={(label) => {
                          const [year, month] = label.split('-')
                          return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        }}
                      />
                      <Legend />
                      <Bar dataKey="total" fill="#968F80" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" fill="#7c9885" name="Resolved" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="critical" fill="#dc2626" name="Critical" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Severity Distribution */}
            {summary.bySeverity?.length > 0 && (
              <div>
                <h3 className="text-sm text-warm-500 mb-3">Severity Distribution</h3>
                <div className="space-y-2">
                  {summary.bySeverity.map((sev) => {
                    const total = summary.bySeverity.reduce((sum, s) => sum + s.count, 0)
                    const percentage = total > 0 ? (sev.count / total) * 100 : 0
                    return (
                      <div key={sev.severity} className="flex items-center gap-3">
                        <span className={`w-20 text-sm capitalize badge ${severityColors[sev.severity]}`}>
                          {sev.severity}
                        </span>
                        <div className="flex-1 h-2 bg-cream-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sev.severity === 'critical' ? 'bg-red-500' :
                              sev.severity === 'high' ? 'bg-orange-500' :
                              sev.severity === 'medium' ? 'bg-yellow-500' : 'bg-sage-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-warm-600 w-8 text-right">{sev.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Incidents List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-warm-800">
            {filter === 'all' ? 'All Incidents' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Incidents`}
          </h2>
          {filter !== 'all' && (
            <button 
              onClick={() => setFilter('all')}
              className="text-sm text-sage-600 hover:text-sage-700"
            >
              Show all
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-warm-300 mx-auto mb-3" />
              <p className="text-warm-400">No incidents found</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const StatusIcon = statusIcons[incident.status]
              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors cursor-pointer group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${statusColors[incident.status]}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-mono text-warm-400">{incident.id}</span>
                      <span className={`badge text-xs ${severityColors[incident.severity]}`}>
                        {incident.severity}
                      </span>
                    </div>
                    <p className="font-medium text-warm-800 truncate mt-1">{incident.title}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className={`badge ${statusColors[incident.status]}`}>
                      {incident.status}
                    </span>
                    <p className="text-xs text-warm-400 mt-1">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-warm-300 group-hover:text-warm-500 transition-colors flex-shrink-0" />
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* About QAPI */}
      <div className="card bg-sage-50 border-sage-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sage-200 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-sage-700" />
          </div>
          <div>
            <h3 className="font-semibold text-sage-800">About Kate's QAPI System</h3>
            <p className="text-sage-700 text-sm mt-1">
              Quality Assurance & Performance Improvement tracks incidents, conducts root cause analysis, 
              and implements corrective actions. When something goes wrong, QAPI Manager investigates 
              and ensures continuous improvement.
            </p>
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  )
}

function IncidentModal({ incident, onClose }) {
  const StatusIcon = statusIcons[incident.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cream-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[incident.status]}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-mono text-warm-400">{incident.id}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`badge ${severityColors[incident.severity]}`}>
                  {incident.severity}
                </span>
                <span className={`badge ${statusColors[incident.status]}`}>
                  {incident.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream-100 text-warm-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <h2 className="text-xl font-semibold text-warm-800 mb-4">{incident.title}</h2>
          
          {incident.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-warm-500 mb-2">Description</h3>
              <p className="text-warm-700 whitespace-pre-wrap">{incident.description}</p>
            </div>
          )}

          {incident.root_cause && (
            <div className="mb-6 p-4 rounded-xl bg-cream-50">
              <h3 className="text-sm font-medium text-warm-500 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Root Cause Analysis
              </h3>
              <p className="text-warm-700 whitespace-pre-wrap">{incident.root_cause}</p>
            </div>
          )}

          {incident.corrective_action && (
            <div className="mb-6 p-4 rounded-xl bg-sage-50">
              <h3 className="text-sm font-medium text-sage-700 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Corrective Action
              </h3>
              <p className="text-sage-800 whitespace-pre-wrap">{incident.corrective_action}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cream-200">
            <div>
              <span className="text-sm text-warm-400">Created</span>
              <p className="text-warm-700">
                {new Date(incident.created_at).toLocaleString()}
              </p>
            </div>
            {incident.resolved_at && (
              <div>
                <span className="text-sm text-warm-400">Resolved</span>
                <p className="text-warm-700">
                  {new Date(incident.resolved_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
