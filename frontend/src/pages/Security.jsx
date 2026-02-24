import { API_URL } from '../config.js';
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const severityColors = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  advisory: 'bg-gold-500/15 text-gold-400 border-gold-500/30',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

const priorityColors = {
  high: 'bg-red-500/15 text-red-400',
  medium: 'bg-gold-500/15 text-gold-400',
  low: 'bg-teal-500/15 text-teal-400',
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
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-text-200 flex items-center gap-2">
            <Shield className="w-7 h-7 text-teal-400" />
            Security & Community
          </h1>
          <p className="text-text-400 mt-1">OpenClaw monitoring and recommendations</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <div className={`card ${summary?.criticalAlerts > 0 ? 'bg-red-500/10 border-red-500/30' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-400">Critical Alerts</p>
              <p className={`text-2xl font-semibold ${summary?.criticalAlerts > 0 ? 'text-red-400' : 'text-text-200'}`}>
                {summary?.criticalAlerts || 0}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              summary?.criticalAlerts > 0 ? 'bg-red-500/15' : 'bg-dark-500'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${summary?.criticalAlerts > 0 ? 'text-red-400' : 'text-text-500'}`} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-400">Active Alerts</p>
              <p className="text-2xl font-semibold text-text-200">{summary?.activeAlerts || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-gold-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-400">Pending Recs</p>
              <p className="text-2xl font-semibold text-text-200">{summary?.pendingRecommendations || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-gold-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-400">Recent Issues</p>
              <p className="text-2xl font-semibold text-text-200">{summary?.recentIssues || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-400">QAPI Links</p>
              <p className="text-2xl font-semibold text-text-200">{summary?.qapiCorrelations || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-teal-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Latest Report Banner */}
      {summary?.latestReport && (
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="card bg-teal-500/10 border-teal-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-300">
                <span className="font-medium text-text-200">Latest Report:</span> {summary.latestReport.date}
              </p>
              {summary.latestReport.summary && (
                <p className="text-sm text-text-400 mt-1">{summary.latestReport.summary}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex gap-2 border-b border-dark-300/30"
      >
        {['overview', 'alerts', 'community', 'recommendations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-text-500 hover:text-text-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Alerts Preview */}
          <div className="card">
            <h3 className="font-semibold text-text-200 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gold-400" />
              Security Alerts
            </h3>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-10 h-10 text-text-600 mx-auto mb-3" />
                <p className="text-text-500 text-sm">No active alerts</p>
                <p className="text-text-600 text-xs mt-1">All clear for now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${severityColors[alert.severity]}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-text-200">{alert.title}</p>
                        <p className="text-sm mt-1 text-text-400">{alert.description}</p>
                      </div>
                      {alert.source_url && (
                        <a href={alert.source_url} target="_blank" rel="noopener noreferrer"
                           className="flex-shrink-0 p-1.5 rounded-lg hover:bg-dark-500/50 text-text-400">
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
            <h3 className="font-semibold text-text-200 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-gold-400" />
              Recommendations
            </h3>
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-10 h-10 text-text-600 mx-auto mb-3" />
                <p className="text-text-500 text-sm">No pending recommendations</p>
                <p className="text-text-600 text-xs mt-1">Check back after the next security scan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map(rec => (
                  <div key={rec.id} className="p-3 rounded-lg bg-dark-600/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[rec.priority]}`}>{rec.priority}</span>
                          <p className="font-medium text-text-200">{rec.title}</p>
                        </div>
                        <p className="text-sm text-text-400 mt-1">{rec.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRecommendationAction(rec.id, 'implemented')}
                          className="p-1.5 rounded-lg hover:bg-teal-500/15 text-teal-400"
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
            <h3 className="font-semibold text-text-200 mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-teal-400" />
              QAPI Correlations
            </h3>
            {correlations.length === 0 ? (
              <div className="text-center py-8">
                <Link2 className="w-10 h-10 text-text-600 mx-auto mb-3" />
                <p className="text-text-500 text-sm">No correlations found yet</p>
                <p className="text-text-600 text-xs mt-1">Correlations are generated when security issues map to QAPI incidents</p>
              </div>
            ) : (
              <div className="space-y-2">
                {correlations.map(corr => (
                  <div key={corr.id} className="flex items-center gap-4 p-3 rounded-lg bg-dark-600/50">
                    <div className="flex-1">
                      <p className="font-medium text-text-200">{corr.title}</p>
                      <p className="text-sm text-text-400">{corr.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400">{corr.qapi_correlation}</span>
                      <p className="text-xs text-text-500 mt-1">{corr.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'alerts' && (
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="card"
        >
          <h3 className="font-semibold text-text-200 mb-4">All Security Alerts</h3>
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-text-600 mx-auto mb-3" />
              <p className="text-text-400 font-medium">No active security alerts</p>
              <p className="text-text-500 text-sm mt-1">The security scanner will report new alerts here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border ${severityColors[alert.severity]}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase">{alert.severity}</span>
                        <span className="text-xs text-text-500">|</span>
                        <span className="text-xs text-text-500">{alert.source}</span>
                      </div>
                      <p className="font-medium text-text-200 mt-1">{alert.title}</p>
                      <p className="text-sm mt-2 text-text-400">{alert.description}</p>
                      {alert.recommendation && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gold-400">
                          <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{alert.recommendation}</span>
                        </div>
                      )}
                    </div>
                    {alert.source_url && (
                      <a href={alert.source_url} target="_blank" rel="noopener noreferrer"
                         className="flex-shrink-0 p-2 rounded-lg hover:bg-dark-500/50 text-text-400">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'community' && (
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="card"
        >
          <h3 className="font-semibold text-text-200 mb-4">Community Issues & Trends</h3>
          {issues.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-text-600 mx-auto mb-3" />
              <p className="text-text-400 font-medium">No community issues tracked yet</p>
              <p className="text-text-500 text-sm mt-1">Issues from GitHub, forums, and social channels will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map(issue => {
                const Icon = categoryIcons[issue.category] || AlertCircle
                return (
                  <div key={issue.id} className="flex items-start gap-4 p-4 rounded-xl bg-dark-600/50">
                    <div className="w-10 h-10 rounded-lg bg-dark-500 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-text-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-200">{issue.title}</p>
                        {issue.mentions > 1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-dark-400 text-text-300">{issue.mentions} mentions</span>
                        )}
                      </div>
                      <p className="text-sm text-text-400 mt-1">{issue.description}</p>
                      {issue.qapi_correlation && (
                        <p className="text-xs text-teal-400 mt-2 flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          Linked to {issue.qapi_correlation}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-text-500">
                      <p>{issue.source}</p>
                      {issue.source_url && (
                        <a href={issue.source_url} target="_blank" rel="noopener noreferrer"
                           className="text-teal-400 hover:underline mt-1 inline-block">View &rarr;</a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'recommendations' && (
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="card"
        >
          <h3 className="font-semibold text-text-200 mb-4">All Recommendations</h3>
          {recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 text-text-600 mx-auto mb-3" />
              <p className="text-text-400 font-medium">No pending recommendations</p>
              <p className="text-text-500 text-sm mt-1">Recommendations are generated from security scans and community analysis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map(rec => (
                <div key={rec.id} className="flex items-start gap-4 p-4 rounded-xl bg-dark-600/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[rec.priority]}`}>{rec.priority}</span>
                      <p className="font-medium text-text-200">{rec.title}</p>
                    </div>
                    <p className="text-sm text-text-400 mt-2">{rec.description}</p>
                    {rec.category && (
                      <p className="text-xs text-text-500 mt-2">Category: {rec.category}</p>
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
        </motion.div>
      )}

      {/* Empty State - No Reports Yet */}
      {!summary?.latestReport && (
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="card text-center py-8"
        >
          <Shield className="w-12 h-12 text-text-600 mx-auto mb-3" />
          <h3 className="font-medium text-text-300">No reports yet</h3>
          <p className="text-sm text-text-500 mt-1">
            The security monitor runs daily at 6:00 AM CT.<br />
            First report will appear after the next scan.
          </p>
        </motion.div>
      )}
    </div>
  )
}
