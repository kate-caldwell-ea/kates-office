import { API_URL } from '../config.js';
import { useEffect, useState } from 'react'
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Users,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  FileText,
  Link2,
  TrendingUp,
  Clock,
} from 'lucide-react'

const severityColors = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  advisory: 'bg-orange-100 text-orange-700 border-orange-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
}

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-sage-100 text-sage-700',
}

const categoryIcons = {
  frustration: Users,
  bug: AlertCircle,
  feature_request: Lightbulb,
  tip: CheckCircle2,
}

export default function Security() {
  const [summary, setSummary] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [issues, setIssues] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [correlations, setCorrelations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sumRes, alertsRes, issuesRes, recsRes, corrRes] = await Promise.all([
        fetch(`${API_URL}/security/summary`),
        fetch(`${API_URL}/security/alerts`),
        fetch(`${API_URL}/security/community?limit=10`),
        fetch(`${API_URL}/security/recommendations?status=pending`),
        fetch(`${API_URL}/security/correlations`),
      ])
      
      setSummary(await sumRes.json())
      setAlerts(await alertsRes.json())
      setIssues(await issuesRes.json())
      setRecommendations(await recsRes.json())
      setCorrelations(await corrRes.json())
    } catch (err) {
      console.error('Failed to fetch security data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRecommendationAction = async (id, status) => {
    try {
      await fetch(`${API_URL}/security/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchData()
    } catch (err) {
      console.error('Failed to update recommendation:', err)
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-warm-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-sage-600" />
            Security & Community
          </h1>
          <p className="text-warm-500 mt-1">OpenClaw monitoring and recommendations</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`card ${summary?.criticalAlerts > 0 ? 'bg-red-50 border-red-200' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Critical Alerts</p>
              <p className={`text-2xl font-semibold ${summary?.criticalAlerts > 0 ? 'text-red-600' : 'text-warm-800'}`}>
                {summary?.criticalAlerts || 0}
              </p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${summary?.criticalAlerts > 0 ? 'text-red-500' : 'text-warm-300'}`} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Active Alerts</p>
              <p className="text-2xl font-semibold text-warm-800">{summary?.activeAlerts || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Pending Recs</p>
              <p className="text-2xl font-semibold text-warm-800">{summary?.pendingRecommendations || 0}</p>
            </div>
            <Lightbulb className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Recent Issues</p>
              <p className="text-2xl font-semibold text-warm-800">{summary?.recentIssues || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">QAPI Links</p>
              <p className="text-2xl font-semibold text-warm-800">{summary?.qapiCorrelations || 0}</p>
            </div>
            <Link2 className="w-8 h-8 text-sage-400" />
          </div>
        </div>
      </div>

      {/* Latest Report Banner */}
      {summary?.latestReport && (
        <div className="card bg-sage-50 border-sage-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-sage-600" />
            <div className="flex-1">
              <p className="text-sm text-sage-700">
                <span className="font-medium">Latest Report:</span> {summary.latestReport.date}
              </p>
              {summary.latestReport.summary && (
                <p className="text-sm text-sage-600 mt-1">{summary.latestReport.summary}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cream-200">
        {['overview', 'alerts', 'community', 'recommendations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-sage-500 text-sage-700'
                : 'border-transparent text-warm-500 hover:text-warm-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts Preview */}
          <div className="card">
            <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Security Alerts
            </h3>
            {alerts.length === 0 ? (
              <p className="text-warm-400 text-sm text-center py-4">No active alerts 🎉</p>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${severityColors[alert.severity]}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm mt-1 opacity-80">{alert.description}</p>
                      </div>
                      {alert.source_url && (
                        <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations Preview */}
          <div className="card">
            <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Recommendations
            </h3>
            {recommendations.length === 0 ? (
              <p className="text-warm-400 text-sm text-center py-4">No pending recommendations</p>
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map(rec => (
                  <div key={rec.id} className="p-3 rounded-lg bg-cream-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${priorityColors[rec.priority]}`}>{rec.priority}</span>
                          <p className="font-medium text-warm-800">{rec.title}</p>
                        </div>
                        <p className="text-sm text-warm-500 mt-1">{rec.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRecommendationAction(rec.id, 'implemented')}
                          className="p-1.5 rounded-lg hover:bg-sage-100 text-sage-600"
                          title="Mark as implemented"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QAPI Correlations */}
          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-sage-500" />
              QAPI Correlations
            </h3>
            {correlations.length === 0 ? (
              <p className="text-warm-400 text-sm text-center py-4">No correlations found yet</p>
            ) : (
              <div className="space-y-2">
                {correlations.map(corr => (
                  <div key={corr.id} className="flex items-center gap-4 p-3 rounded-lg bg-cream-50">
                    <div className="flex-1">
                      <p className="font-medium text-warm-800">{corr.title}</p>
                      <p className="text-sm text-warm-500">{corr.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-sage">{corr.qapi_correlation}</span>
                      <p className="text-xs text-warm-400 mt-1">{corr.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="card">
          <h3 className="font-semibold text-warm-800 mb-4">All Security Alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-warm-400 text-center py-8">No active security alerts</p>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border ${severityColors[alert.severity]}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase">{alert.severity}</span>
                        <span className="text-xs opacity-60">•</span>
                        <span className="text-xs opacity-60">{alert.source}</span>
                      </div>
                      <p className="font-medium mt-1">{alert.title}</p>
                      <p className="text-sm mt-2 opacity-80">{alert.description}</p>
                      {alert.recommendation && (
                        <p className="text-sm mt-2 font-medium">💡 {alert.recommendation}</p>
                      )}
                    </div>
                    {alert.source_url && (
                      <a href={alert.source_url} target="_blank" rel="noopener noreferrer" 
                         className="flex-shrink-0 p-2 rounded-lg hover:bg-white/50">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'community' && (
        <div className="card">
          <h3 className="font-semibold text-warm-800 mb-4">Community Issues & Trends</h3>
          {issues.length === 0 ? (
            <p className="text-warm-400 text-center py-8">No community issues tracked yet</p>
          ) : (
            <div className="space-y-3">
              {issues.map(issue => {
                const Icon = categoryIcons[issue.category] || AlertCircle
                return (
                  <div key={issue.id} className="flex items-start gap-4 p-4 rounded-xl bg-cream-50">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-warm-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-warm-800">{issue.title}</p>
                        {issue.mentions > 1 && (
                          <span className="badge badge-cream">{issue.mentions} mentions</span>
                        )}
                      </div>
                      <p className="text-sm text-warm-500 mt-1">{issue.description}</p>
                      {issue.qapi_correlation && (
                        <p className="text-xs text-sage-600 mt-2">🔗 Linked to {issue.qapi_correlation}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-warm-400">
                      <p>{issue.source}</p>
                      {issue.source_url && (
                        <a href={issue.source_url} target="_blank" rel="noopener noreferrer" 
                           className="text-sage-600 hover:underline">View →</a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="card">
          <h3 className="font-semibold text-warm-800 mb-4">All Recommendations</h3>
          {recommendations.length === 0 ? (
            <p className="text-warm-400 text-center py-8">No pending recommendations</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map(rec => (
                <div key={rec.id} className="flex items-start gap-4 p-4 rounded-xl bg-cream-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${priorityColors[rec.priority]}`}>{rec.priority}</span>
                      <p className="font-medium text-warm-800">{rec.title}</p>
                    </div>
                    <p className="text-sm text-warm-500 mt-2">{rec.description}</p>
                    {rec.category && (
                      <p className="text-xs text-warm-400 mt-2">Category: {rec.category}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRecommendationAction(rec.id, 'implemented')}
                      className="btn btn-primary text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Implement
                    </button>
                    <button
                      onClick={() => handleRecommendationAction(rec.id, 'dismissed')}
                      className="btn btn-secondary text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!summary?.latestReport && (
        <div className="card bg-cream-50 border-cream-200 text-center py-8">
          <Shield className="w-12 h-12 text-warm-300 mx-auto mb-3" />
          <h3 className="font-medium text-warm-700">No reports yet</h3>
          <p className="text-sm text-warm-500 mt-1">
            The security monitor runs daily at 6:00 AM CT.<br />
            First report will appear after the next scan.
          </p>
        </div>
      )}
    </div>
  )
}
