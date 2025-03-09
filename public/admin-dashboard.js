// admin-dashboard.js - Part 1: Setup and Layout
const AdminDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = React.useState('sessions');
  const [selectedSession, setSelectedSession] = React.useState(null);
  const [selectedAssessment, setSelectedAssessment] = React.useState(null);
  const [filterValue, setFilterValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Data state
  const [sessions, setSessions] = React.useState([]);
  const [assessments, setAssessments] = React.useState([]);
  const [stats, setStats] = React.useState({
    totalSessions: 0,
    completedAssessments: 0,
    averageScore: 0,
    highestRated: null
  });

  // Event handlers
  const handleViewSession = (session) => {
    setSelectedSession(session);
    setActiveTab('conversation');
  };

  const handleViewAssessment = (assessment) => {
    setSelectedAssessment(assessment);
    setActiveTab('assessment-detail');
  };

  const handleBackToSessions = () => {
    setSelectedSession(null);
    setActiveTab('sessions');
  };

  const handleBackToAssessments = () => {
    setSelectedAssessment(null);
    setActiveTab('assessments');
  };

  const handleFilterChange = (e) => {
    setFilterValue(e.target.value);
  };

  const handleApplyFilter = () => {
    // This would trigger a re-fetch with the filter applied
    fetchSessions();
  };

  // API calls
  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchSessions(),
        fetchAssessments()
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const apiKey = localStorage.getItem('adminApiKey');
      const response = await fetch('/api/stats', {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data.stats || {
        totalSessions: 0,
        completedAssessments: 0,
        averageScore: 0,
        highestRated: null
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const apiKey = localStorage.getItem('adminApiKey');
      let url = '/api/sessions';
      
      if (filterValue) {
        url += `?workshopId=${encodeURIComponent(filterValue)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchAssessments = async () => {
    try {
      const apiKey = localStorage.getItem('adminApiKey');
      const response = await fetch('/api/assessments', {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assessments');
      }
      
      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    }
  };

  // Load data on component mount
  React.useEffect(() => {
    fetchData();
  }, []);

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  // Filter sessions
  const filteredSessions = React.useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    if (!filterValue) return sessions;
    
    return sessions.filter(session => {
      if (!session.workshopId) return false;
      return session.workshopId.toLowerCase().includes(filterValue.toLowerCase());
    });
  }, [sessions, filterValue]);

  // Score badge color helpers
  const getScoreBadgeColor = (score, type) => {
    if (type === 'total') {
      if (score >= 12) return 'bg-green-100 text-green-800';
      if (score >= 8) return 'bg-blue-100 text-blue-800';
      return 'bg-yellow-100 text-yellow-800';
    } else {
      if (score >= 4) return 'bg-green-100 text-green-800';
      if (score >= 3) return 'bg-blue-100 text-blue-800';
      return 'bg-yellow-100 text-yellow-800';
    }
  };