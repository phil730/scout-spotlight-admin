// admin.js - SCOUT Spotlight Admin Dashboard functionality

document.addEventListener('DOMContentLoaded', () => {
  // State management
  const state = {
    apiKey: localStorage.getItem('adminApiKey') || '',
    activeTab: 'dashboard',
    sessions: [],
    assessments: [],
    currentSession: null,
    currentAssessment: null,
    currentPage: 1,
    pageSize: 10,
    workshopFilter: '',
    stats: {},
    charts: {},
    sortColumn: null,
    sortDirection: 'asc'
  };

  // DOM elements - Login/Logout
  const elements = {
    loginScreen: document.getElementById('login-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    loginForm: document.getElementById('login-form'),
    logoutButton: document.getElementById('logout-button'),
    
    // Tabs
    tabButtons: document.querySelectorAll('.tab-button'),
    
    // Panels
    dashboardPanel: document.getElementById('dashboard-panel'),
    assessmentsPanel: document.getElementById('assessments-panel'),
    sessionsPanel: document.getElementById('sessions-panel'),
    reportsPanel: document.getElementById('reports-panel'),
    assessmentDetailView: document.getElementById('assessment-detail-view'),
    assessmentsListView: document.getElementById('assessments-list-view'),
    sessionDetailView: document.getElementById('session-detail-view'),
    
    // Stats elements
    totalSessions: document.getElementById('total-sessions'),
    completedAssessments: document.getElementById('completed-assessments'),
    averageScore: document.getElementById('average-score'),
    highQualityCount: document.getElementById('high-quality-count'),
    
    // Table elements
    topInnovationsTableBody: document.getElementById('top-innovations-table-body'),
    assessmentsTableBody: document.getElementById('assessments-table-body'),
    sessionsTableBody: document.getElementById('sessions-table-body'),
    
    // Pagination
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    paginationPages: document.getElementById('pagination-pages'),
    pageInfo: {
      start: document.getElementById('page-start'),
      end: document.getElementById('page-end'),
      total: document.getElementById('total-items')
    },
    
    // Session pagination
    sessionsPrevPage: document.getElementById('sessions-prev-page'),
    sessionsNextPage: document.getElementById('sessions-next-page'),
    sessionsPaginationPages: document.getElementById('sessions-pagination-pages'),
    sessionsPageInfo: {
      start: document.getElementById('sessions-page-start'),
      end: document.getElementById('sessions-page-end'),
      total: document.getElementById('total-sessions-count')
    },
    
    // Detail views
    backToAssessments: document.getElementById('back-to-assessments'),
    backToSessions: document.getElementById('back-to-sessions'),
    
    // Search inputs
    assessmentSearch: document.getElementById('assessment-search'),
    sessionSearch: document.getElementById('session-search'),
    
    // Charts
    scoreDistributionChart: document.getElementById('score-distribution-chart'),
    monthlyAssessmentsChart: document.getElementById('monthly-assessments-chart'),
    themesChart: document.getElementById('themes-chart'),
    
    // Assessment detail elements
    assessmentInnovationName: document.getElementById('assessment-innovation-name'),
    assessmentDate: document.getElementById('assessment-date'),
    problemValueScore: document.getElementById('problem-value-score'),
    problemValueLabel: document.getElementById('problem-value-label'),
    solutionFitScore: document.getElementById('solution-fit-score'),
    solutionFitLabel: document.getElementById('solution-fit-label'),
    valueMoneyScore: document.getElementById('value-money-score'),
    valueMoneyLabel: document.getElementById('value-money-label'),
    scoreQualityBadge: document.getElementById('score-quality-badge'),
    totalScoreValue: document.getElementById('total-score-value'),
    totalScoreProgress: document.getElementById('total-score-progress'),
    analysisContent: document.getElementById('analysis-content'),
    recommendationContent: document.getElementById('recommendation-content'),
    
    // Conversation elements
    conversationMetadata: document.getElementById('conversation-metadata'),
    conversationMessages: document.getElementById('conversation-messages'),
    
    // Loading
    loadingOverlay: document.getElementById('loading-overlay')
  };

  // API functions
  const api = {
    // Base API call function with authentication
    async call(endpoint, method = 'GET', data = null) {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': state.apiKey
        }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      try {
        // Use the API routes without the /admin/ prefix
        const response = await fetch(`/api/${endpoint}`, options);
        
        if (response.status === 401) {
          // Handle unauthorized access
          logout();
          showError('Unauthorized access. Please log in again.');
          return null;
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API call failed');
        }
        
        return await response.json();
      } catch (error) {
        console.error(`API error (${endpoint}):`, error);
        showError(`API error: ${error.message}`);
        return null;
      }
    },
    
    // Get dashboard statistics
    async getStats() {
      return await this.call('stats');
    },
    
    // Get all sessions
    async getSessions(workshopFilter = '', searchTerm = '') {
      let query = '';
      
      if (workshopFilter || searchTerm) {
        const params = new URLSearchParams();
        if (workshopFilter) params.append('workshopId', workshopFilter);
        if (searchTerm) params.append('search', searchTerm);
        query = `?${params.toString()}`;
      }
      
      return await this.call(`sessions${query}`);
    },
    
    // Get all assessments
    async getAssessments(searchTerm = '') {
      let query = '';
      
      if (searchTerm) {
        query = `?search=${encodeURIComponent(searchTerm)}`;
      }
      
      return await this.call(`assessments${query}`);
    },
    
    // Get conversation details for a session
    async getConversation(sessionId) {
      return await this.call(`conversation?sessionId=${encodeURIComponent(sessionId)}`);
    },
    
    // Get assessment details
    async getAssessmentDetail(id) {
      return await this.call(`assessment?id=${encodeURIComponent(id)}`);
    }
  };

  // Authentication functions
  function login(apiKey) {
    state.apiKey = apiKey;
    localStorage.setItem('adminApiKey', apiKey);
    elements.loginScreen.classList.add('hidden');
    elements.dashboardScreen.classList.remove('hidden');
    loadDashboard();
  }

  function logout() {
    state.apiKey = '';
    localStorage.removeItem('adminApiKey');
    elements.dashboardScreen.classList.add('hidden');
    elements.loginScreen.classList.remove('hidden');
  }

  // Dashboard loading
  async function loadDashboard() {
    showLoading();
    
    try {
      // Set the active tab to dashboard
      setActiveTab('dashboard');
      
      // Load all data
      await Promise.all([
        loadStats(),
        loadSessions(),
        loadAssessments()
      ]);
      
      // Initialize charts
      if (elements.scoreDistributionChart) initCharts();
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showError('Failed to load dashboard data');
    } finally {
      hideLoading();
    }
  }

  async function loadStats() {
    try {
      const data = await api.getStats();
      if (data && data.stats) {
        state.stats = data.stats;
        updateStatsDisplay(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadSessions(searchTerm = '') {
    try {
      const data = await api.getSessions(state.workshopFilter, searchTerm);
      if (data && data.sessions) {
        state.sessions = data.sessions;
        renderSessionsTable();
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  async function loadAssessments(searchTerm = '') {
    try {
      const data = await api.getAssessments(searchTerm);
      if (data && data.assessments) {
        state.assessments = data.assessments;
        renderAssessmentsTable();
        renderTopInnovations();
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  }

  // UI Rendering Functions
  function updateStatsDisplay(stats) {
    if (!stats) return;
    
    elements.totalSessions.textContent = stats.totalSessions || 0;
    elements.completedAssessments.textContent = stats.completedAssessments || 0;
    elements.averageScore.textContent = `${stats.averageScore || 0}/15`;
    
    // Calculate high quality assessments (score >= 12)
    const highQualityCount = state.assessments.filter(a => a.totalScore >= 12).length;
    elements.highQualityCount.textContent = highQualityCount;
  }

  function renderTopInnovations() {
    if (!elements.topInnovationsTableBody) return;
    
    // Get top 5 innovations by total score
    const topInnovations = [...state.assessments]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);
    
    elements.topInnovationsTableBody.innerHTML = '';
    
    if (topInnovations.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="6" class="text-center">No assessments found</td>`;
      elements.topInnovationsTableBody.appendChild(emptyRow);
      return;
    }
    
    topInnovations.forEach(assessment => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${assessment.innovationName}</td>
        <td>
          <span class="score-badge ${getScoreBadgeClass(assessment.problemValue, 'dimension')}">
            ${assessment.problemValue}/5
          </span>
        </td>
        <td>
          <span class="score-badge ${getScoreBadgeClass(assessment.solutionFit, 'dimension')}">
            ${assessment.solutionFit}/5
          </span>
        </td>
        <td>
          <span class="score-badge ${getScoreBadgeClass(assessment.valueForMoney, 'dimension')}">
            ${assessment.valueForMoney}/5
          </span>
        </td>
        <td>
          <span class="score-badge ${getScoreBadgeClass(assessment.totalScore, 'total')}">
            ${assessment.totalScore}/15
          </span>
        </td>
        <td>
          <button class="view-button" data-assessment-id="${assessment._id || assessment.id}">
            <i data-lucide="eye" class="w-4 h-4"></i>
            View
          </button>
        </td>
      `;
      elements.topInnovationsTableBody.appendChild(row);
    });
    
    // Refresh Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-button[data-assessment-id]').forEach(button => {
      button.addEventListener('click', () => {
        const assessmentId = button.getAttribute('data-assessment-id');
        viewAssessment(assessmentId);
      });
    });
  }

  function renderAssessmentsTable() {
    if (!elements.assessmentsTableBody) return;
    
    // Apply filters and pagination
    const filteredAssessments = getFilteredAssessments();
    const paginatedAssessments = getPaginatedItems(filteredAssessments);
    
    elements.assessmentsTableBody.innerHTML = '';
    
    if (paginatedAssessments.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="7" class="text-center">No assessments found</td>`;
      elements.assessmentsTableBody.appendChild(emptyRow);
    } else {
      paginatedAssessments.forEach(assessment => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${assessment.innovationName}</td>
          <td>
            <span class="score-badge ${getScoreBadgeClass(assessment.problemValue, 'dimension')}">
              ${assessment.problemValue}/5
            </span>
          </td>
          <td>
            <span class="score-badge ${getScoreBadgeClass(assessment.solutionFit, 'dimension')}">
              ${assessment.solutionFit}/5
            </span>
          </td>
          <td>
            <span class="score-badge ${getScoreBadgeClass(assessment.valueForMoney, 'dimension')}">
              ${assessment.valueForMoney}/5
            </span>
          </td>
          <td>
            <span class="score-badge ${getScoreBadgeClass(assessment.totalScore, 'total')}">
              ${assessment.totalScore}/15
            </span>
          </td>
          <td>${formatDate(assessment.completed)}</td>
          <td>
            <button class="view-button" data-assessment-id="${assessment._id || assessment.id}">
              <i data-lucide="eye" class="w-4 h-4"></i>
              View
            </button>
          </td>
        `;
        elements.assessmentsTableBody.appendChild(row);
      });
      
      // Refresh Lucide icons
      if (window.lucide) {
        lucide.createIcons();
      }
      
      // Add event listeners to view buttons
      document.querySelectorAll('.view-button[data-assessment-id]').forEach(button => {
        button.addEventListener('click', () => {
          const assessmentId = button.getAttribute('data-assessment-id');
          viewAssessment(assessmentId);
        });
      });
    }
    
    // Update pagination info
    updatePagination(filteredAssessments, 'assessment');
  }

  function renderSessionsTable() {
    if (!elements.sessionsTableBody) return;
    
    // Apply filters and pagination
    const filteredSessions = getFilteredSessions();
    const paginatedSessions = getPaginatedItems(filteredSessions, 'sessions');
    
    elements.sessionsTableBody.innerHTML = '';
    
    if (paginatedSessions.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="7" class="text-center">No sessions found</td>`;
      elements.sessionsTableBody.appendChild(emptyRow);
    } else {
      paginatedSessions.forEach(session => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${session.sessionId || session.id}</td>
          <td>${session.innovationName}</td>
          <td>${formatDate(session.created)}</td>
          <td>${formatDate(session.lastActivity)}</td>
          <td>${session.workshopId || '-'}</td>
          <td>
            <span class="status-badge ${session.completed ? 'status-completed' : 'status-in-progress'}">
              ${session.completed ? 'Completed' : 'In Progress'}
            </span>
          </td>
          <td>
            <button class="view-button" data-session-id="${session.sessionId || session.id}">
              <i data-lucide="eye" class="w-4 h-4"></i>
              View
            </button>
          </td>
        `;
        elements.sessionsTableBody.appendChild(row);
      });
      
      // Refresh Lucide icons
      if (window.lucide) {
        lucide.createIcons();
      }
      
      // Add event listeners to view buttons
      document.querySelectorAll('.view-button[data-session-id]').forEach(button => {
        button.addEventListener('click', () => {
          const sessionId = button.getAttribute('data-session-id');
          viewSession(sessionId);
        });
      });
    }
    
    // Update pagination info
    updatePagination(filteredSessions, 'sessions');
  }

  // Session and Assessment Detail Views
  async function viewSession(sessionId) {
    showLoading();
    
    try {
      const data = await api.getConversation(sessionId);
      
      if (data && data.session) {
        state.currentSession = data.session;
        renderConversationDetails(data.session, data.messages || []);
        
        // Show session detail view and hide sessions list
        elements.sessionsPanel.classList.add('hidden');
        elements.sessionDetailView.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error viewing session:', error);
      showError('Failed to load conversation details');
    } finally {
      hideLoading();
    }
  }

  async function viewAssessment(assessmentId) {
    showLoading();
    
    try {
      const data = await api.getAssessmentDetail(assessmentId);
      
      if (data && data.assessment) {
        state.currentAssessment = data.assessment;
        renderAssessmentDetails(data.assessment);
        
        // Show assessment detail view and hide assessments list
        elements.assessmentsListView.classList.add('hidden');
        elements.assessmentDetailView.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error viewing assessment:', error);
      showError('Failed to load assessment details');
    } finally {
      hideLoading();
    }
  }

  function renderConversationDetails(session, messages) {
    if (!elements.conversationMetadata || !elements.conversationMessages) return;
    
    // Metadata
    elements.conversationMetadata.innerHTML = `
      <p><strong>Session ID:</strong> <span>${session.sessionId || session.id}</span></p>
      <p><strong>Innovation:</strong> <span>${session.innovationName}</span></p>
      <p><strong>Created:</strong> <span>${formatDate(session.created)}</span></p>
      <p><strong>Last Activity:</strong> <span>${formatDate(session.lastActivity)}</span></p>
      <p><strong>Workshop ID:</strong> <span>${session.workshopId || 'None'}</span></p>
      <p><strong>Status:</strong> <span>${session.completed ? 'Completed' : 'In Progress'}</span></p>
    `;
    
    // Messages - with Markdown support
    elements.conversationMessages.innerHTML = '';
    
    if (messages.length === 0) {
      elements.conversationMessages.innerHTML = '<div class="text-center">No messages found</div>';
    } else {
      messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${message.role}`;
        
        // Use marked to parse markdown in the message content
        const parsedContent = marked.parse(message.content);
        
        messageDiv.innerHTML = `
          <div class="message-header">
            <span class="message-role">${message.role === 'assistant' ? 'SCOUT Spotlight' : message.role === 'user' ? 'User' : 'System'}</span>
            <span class="message-time">${formatDate(message.timestamp)}</span>
          </div>
          <div class="message-content">${parsedContent}</div>
        `;
        
        elements.conversationMessages.appendChild(messageDiv);
      });
    }
  }

  function renderAssessmentDetails(assessment) {
    if (!assessment) return;
    
    // Basic info
    elements.assessmentInnovationName.textContent = assessment.innovationName;
    elements.assessmentDate.textContent = `Assessed on ${formatDate(assessment.completed)}`;
    
    // Problem Value score
    elements.problemValueScore.textContent = `${assessment.problemValue}/5`;
    elements.problemValueScore.className = `score-value ${getScoreClass(assessment.problemValue, 'dimension')}`;
    elements.problemValueLabel.textContent = getScoreDimensionLabel(assessment.problemValue, 'problem');
    
    // Solution Fit score
    elements.solutionFitScore.textContent = `${assessment.solutionFit}/5`;
    elements.solutionFitScore.className = `score-value ${getScoreClass(assessment.solutionFit, 'dimension')}`;
    elements.solutionFitLabel.textContent = getScoreDimensionLabel(assessment.solutionFit, 'solution');
    
    // Value for Money score
    elements.valueMoneyScore.textContent = `${assessment.valueForMoney}/5`;
    elements.valueMoneyScore.className = `score-value ${getScoreClass(assessment.valueForMoney, 'dimension')}`;
    elements.valueMoneyLabel.textContent = getScoreDimensionLabel(assessment.valueForMoney, 'value');
    
    // Total score
    elements.totalScoreValue.textContent = `${assessment.totalScore}/15`;
    elements.totalScoreProgress.style.width = `${(assessment.totalScore / 15) * 100}%`;
    
    // Quality badge
    elements.scoreQualityBadge.textContent = getScoreLabel(assessment.totalScore);
    elements.scoreQualityBadge.className = `quality-badge ${getScoreBadgeClass(assessment.totalScore, 'total')}`;
    
    // Analysis content - this is placeholder content; in a real implementation,
    // this would come from the API or be generated based on the assessment data
    elements.analysisContent.innerHTML = `
      <p>This innovation addresses a ${getScoreDimensionLabel(assessment.problemValue, 'problem').toLowerCase()} in the market with its focus on improved quality of life through enhanced monitoring and communication features.</p>
      
      <h5>Strengths</h5>
      <ul>
        <li>Targets a clear and growing market need</li>
        <li>Incorporates proven technology with novel integrations</li>
        <li>Good balance of functionality and user-friendliness</li>
      </ul>
      
      <h5>Areas for Improvement</h5>
      <ul>
        <li>Pricing model may limit adoption among cost-sensitive segments</li>
        <li>Integration with existing healthcare systems could be stronger</li>
        <li>Privacy concerns need more thorough mitigation strategies</li>
      </ul>
    `;
    
    // Recommendation content
    elements.recommendationContent.textContent = assessment.recommendation || 'No recommendation available';
  }

  // Chart Initialization
  function initCharts() {
    try {
      // Score distribution chart
      const scoreDistData = generateScoreDistributionData();
      state.charts.scoreDistribution = new Chart(elements.scoreDistributionChart, {
        type: 'bar',
        data: {
          labels: scoreDistData.labels,
          datasets: [{
            label: 'Number of Assessments',
            data: scoreDistData.data,
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
      
      // Monthly assessments chart
      const monthlyData = generateMonthlyData();
      state.charts.monthlyAssessments = new Chart(elements.monthlyAssessmentsChart, {
        type: 'line',
        data: {
          labels: monthlyData.labels,
          datasets: [{
            label: 'Assessments',
            data: monthlyData.data,
            fill: false,
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
      
      // Themes chart
      const themesData = generateThemesData();
      state.charts.themes = new Chart(elements.themesChart, {
        type: 'pie',
        data: {
          labels: themesData.labels,
          datasets: [{
            data: themesData.data,
            backgroundColor: [
              '#3b82f6', // blue
              '#10b981', // green
              '#f59e0b', // yellow
              '#8b5cf6', // purple
              '#64748b'  // gray
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }

  // Data Generation for Charts
  function generateScoreDistributionData() {
    // Create score ranges
    const ranges = [
      { label: '1-5', min: 1, max: 5 },
      { label: '6-8', min: 6, max: 8 },
      { label: '9-11', min: 9, max: 11 },
      { label: '12-15', min: 12, max: 15 }
    ];
    
    // Count assessments in each range
    const counts = ranges.map(range => {
      return state.assessments.filter(a => 
        a.totalScore >= range.min && a.totalScore <= range.max
      ).length;
    });
    
    return {
      labels: ranges.map(r => r.label),
      data: counts
    };
  }

  function generateMonthlyData() {
    // Get the last 6 months
    const months = [];
    const counts = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthYear = `${monthName} ${year}`;
      
      // Get the start and end dates for this month
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Count assessments in this month
      const count = state.assessments.filter(a => {
        const assessmentDate = new Date(a.completed);
        return assessmentDate >= startDate && assessmentDate <= endDate;
      }).length;
      
      months.push(monthYear);
      counts.push(count);
    }
    
    return {
      labels: months,
      data: counts
    };
  }

  function generateThemesData() {
    // Placeholder - in a real implementation, you would extract themes 
    // from the assessment data or get them from the API
    const themes = [
      { name: 'Senior Health', count: 15 },
      { name: 'Medication', count: 10 },
      { name: 'Home Safety', count: 8 },
      { name: 'Monitoring', count: 7 },
      { name: 'Other', count: 4 }
    ];
    
    return {
      labels: themes.map(t => t.name),
      data: themes.map(t => t.count)
    };
  }

  // Utility Functions
  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  }

  function getScoreBadgeClass(score, type) {
    if (type === 'total') {
      if (score >= 12) return 'score-high';
      if (score >= 8) return 'score-medium';
      return 'score-low';
    } else {
      if (score >= 4) return 'score-high';
      if (score >= 3) return 'score-medium';
      return 'score-low';
    }
  }

  function getScoreClass(score, type) {
    if (type === 'total') {
      if (score >= 12) return 'high';
      if (score >= 8) return 'medium';
      return 'low';
    } else {
      if (score >= 4) return 'high';
      if (score >= 3) return 'medium';
      return 'low';
    }
  }

  function getScoreLabel(score) {
    if (score >= 12) return 'High Quality';
    if (score >= 8) return 'Promising';
    return 'Needs Development';
  }

  function getScoreDimensionLabel(score, dimension) {
    if (dimension === 'problem') {
      if (score >= 4) return 'Significant problem';
      if (score >= 3) return 'Moderate problem';
      return 'Limited problem';
    } else if (dimension === 'solution') {
      if (score >= 4) return 'Excellent fit';
      if (score >= 3) return 'Good fit';
      return 'Partial fit';
    } else if (dimension === 'value') {
      if (score >= 4) return 'High value';
      if (score >= 3) return 'Reasonable value';
      return 'Limited value';
    }
  }

  function getFilteredAssessments() {
    const searchTerm = elements.assessmentSearch ? elements.assessmentSearch.value.toLowerCase() : '';
    
    return state.assessments.filter(assessment => {
      // Apply search filter
      if (searchTerm && !assessment.innovationName.toLowerCase().includes(searchTerm)) {
        return false;
      }
      
      return true;
    });
  }

  function getFilteredSessions() {
    const searchTerm = elements.sessionSearch ? elements.sessionSearch.value.toLowerCase() : '';
    
    return state.sessions.filter(session => {
      // Apply search filter
      if (searchTerm && !session.innovationName.toLowerCase().includes(searchTerm)) {
        return false;
      }
      
      // Apply workshop filter (if present)
      if (state.workshopFilter && session.workshopId !== state.workshopFilter) {
        return false;
      }
      
      return true;
    });
  }

  function getPaginatedItems(items, type = 'assessment') {
    const pageSize = state.pageSize;
    const currentPage = type === 'sessions' ? state.sessionsCurrentPage || 1 : state.currentPage;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return items.slice(startIndex, endIndex);
  }

  function updatePagination(items, type = 'assessment') {
    const totalItems = items.length;
    const pageSize = state.pageSize;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = type === 'sessions' ? state.sessionsCurrentPage || 1 : state.currentPage;
    
    // Determine which pagination elements to use
    const prevBtn = type === 'sessions' ? elements.sessionsPrevPage : elements.prevPage;
    const nextBtn = type === 'sessions' ? elements.sessionsNextPage : elements.nextPage;
    const pagesContainer = type === 'sessions' ? elements.sessionsPaginationPages : elements.paginationPages;
    const pageInfo = type === 'sessions' ? elements.sessionsPageInfo : elements.pageInfo;
    
    // Update buttons state
    if (prevBtn) {
      prevBtn.disabled = currentPage <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages;
    }
    
    // Update page numbers
    if (pagesContainer) {
      pagesContainer.innerHTML = '';
      
      // Only show a reasonable number of page buttons
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // First page
      if (startPage > 1) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-page';
        pageBtn.textContent = '1';
        pageBtn.dataset.page = 1;
        pagesContainer.appendChild(pageBtn);
        
        if (startPage > 2) {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'pagination-ellipsis';
          ellipsis.textContent = '...';
          pagesContainer.appendChild(ellipsis);
        }
      }
      
      // Page numbers
      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-page ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.dataset.page = i;
        pagesContainer.appendChild(pageBtn);
      }
      
      // Last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'pagination-ellipsis';
          ellipsis.textContent = '...';
          pagesContainer.appendChild(ellipsis);
        }
        
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-page';
        pageBtn.textContent = totalPages;
        pageBtn.dataset.page = totalPages;
        pagesContainer.appendChild(pageBtn);
      }
      
      // Add event listeners
      document.querySelectorAll(`.pagination-page[data-page]`).forEach(btn => {
        btn.addEventListener('click', (e) => {
          const page = parseInt(e.target.dataset.page);
          if (type === 'sessions') {
            state.sessionsCurrentPage = page;
            renderSessionsTable();
          } else {
            state.currentPage = page;
            renderAssessmentsTable();
          }
        });
      });
    }
    
    // Update page info text
    if (pageInfo && pageInfo.start && pageInfo.end && pageInfo.total) {
      const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
      const endItem = Math.min(startItem + pageSize - 1, totalItems);
      
      pageInfo.start.textContent = startItem;
      pageInfo.end.textContent = endItem;
      pageInfo.total.textContent = totalItems;
    }
  }

  function setActiveTab(tabName) {
    // Update state
    state.activeTab = tabName;
    
    // Update tab button states
    elements.tabButtons.forEach(button => {
      if (button.dataset.tab === tabName) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Hide all panels
    elements.dashboardPanel.classList.add('hidden');
    elements.assessmentsPanel.classList.add('hidden');
    elements.sessionsPanel.classList.add('hidden');
    elements.reportsPanel.classList.add('hidden');
    elements.sessionDetailView.classList.add('hidden');
    
    // Show active panel
    switch (tabName) {
      case 'dashboard':
        elements.dashboardPanel.classList.remove('hidden');
        break;
      case 'assessments':
        elements.assessmentsPanel.classList.remove('hidden');
        elements.assessmentsListView.classList.remove('hidden');
        elements.assessmentDetailView.classList.add('hidden');
        break;
      case 'sessions':
        elements.sessionsPanel.classList.remove('hidden');
        break;
      case 'reports':
        elements.reportsPanel.classList.remove('hidden');
        break;
    }
  }

  function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
  }

  function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
  }

  function showError(message) {
    console.error(message);
    alert(message); // Basic error handling - could be improved with a toast or modal
  }

  // Event Handlers
  function setupEventListeners() {
    // Login form submission
    if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput) {
          login(apiKeyInput.value);
        }
      });
    }
    
    // Logout button
    if (elements.logoutButton) {
      elements.logoutButton.addEventListener('click', logout);
    }
    
    // Tab navigation
    elements.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        setActiveTab(tabName);
      });
    });
    
    // Back buttons
    if (elements.backToAssessments) {
      elements.backToAssessments.addEventListener('click', () => {
        elements.assessmentDetailView.classList.add('hidden');
        elements.assessmentsListView.classList.remove('hidden');
        state.currentAssessment = null;
      });
    }
    
    if (elements.backToSessions) {
      elements.backToSessions.addEventListener('click', () => {
        elements.sessionDetailView.classList.add('hidden');
        elements.sessionsPanel.classList.remove('hidden');
        state.currentSession = null;
      });
    }
    
    // Pagination
    if (elements.prevPage) {
      elements.prevPage.addEventListener('click', () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          renderAssessmentsTable();
        }
      });
    }
    
    if (elements.nextPage) {
      elements.nextPage.addEventListener('click', () => {
        const filteredAssessments = getFilteredAssessments();
        const totalPages = Math.ceil(filteredAssessments.length / state.pageSize);
        
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderAssessmentsTable();
        }
      });
    }
    
    if (elements.sessionsPrevPage) {
      elements.sessionsPrevPage.addEventListener('click', () => {
        if (state.sessionsCurrentPage > 1) {
          state.sessionsCurrentPage--;
          renderSessionsTable();
        }
      });
    }
    
    if (elements.sessionsNextPage) {
      elements.sessionsNextPage.addEventListener('click', () => {
        const filteredSessions = getFilteredSessions();
        const totalPages = Math.ceil(filteredSessions.length / state.pageSize);
        
        if (state.sessionsCurrentPage < totalPages) {
          state.sessionsCurrentPage++;
          renderSessionsTable();
        }
      });
    }
    
    // Search inputs
    if (elements.assessmentSearch) {
      elements.assessmentSearch.addEventListener('input', debounce(() => {
        state.currentPage = 1; // Reset to first page when searching
        renderAssessmentsTable();
      }, 300));
    }
    
    if (elements.sessionSearch) {
      elements.sessionSearch.addEventListener('input', debounce(() => {
        state.sessionsCurrentPage = 1; // Reset to first page when searching
        renderSessionsTable();
      }, 300));
    }
    
    // Filter buttons
    const filterAssessmentsBtn = document.getElementById('filter-assessments');
    if (filterAssessmentsBtn) {
      filterAssessmentsBtn.addEventListener('click', () => {
        // Implementation would depend on your filter UI
        alert('Assessment filtering would be implemented here');
      });
    }
    
    const filterSessionsBtn = document.getElementById('filter-sessions');
    if (filterSessionsBtn) {
      filterSessionsBtn.addEventListener('click', () => {
        // Implementation would depend on your filter UI
        const workshopId = prompt('Enter Workshop ID to filter by (leave empty to show all):');
        state.workshopFilter = workshopId || '';
        state.sessionsCurrentPage = 1; // Reset page
        loadSessions();
      });
    }
    
    // Export buttons
    const exportAssessmentsBtn = document.getElementById('export-assessments');
    if (exportAssessmentsBtn) {
      exportAssessmentsBtn.addEventListener('click', () => {
        exportAssessmentsToCSV();
      });
    }
    
    // Reports buttons
    const viewReportButtons = document.querySelectorAll('.view-report-button');
    viewReportButtons.forEach(button => {
      button.addEventListener('click', () => {
        const reportTitle = button.parentElement.querySelector('.report-title').textContent;
        alert(`${reportTitle} report would be generated here`);
      });
    });
    
    const generateReportBtn = document.getElementById('generate-report');
    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', () => {
        const reportType = document.getElementById('report-type').value;
        const dateRange = document.getElementById('date-range').value;
        const format = document.getElementById('export-format').value;
        
        alert(`Generating ${reportType} report for ${dateRange} in ${format} format`);
      });
    }
    
    // Assessment actions
    const exportPdfBtn = document.getElementById('export-assessment-pdf');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => {
        if (state.currentAssessment) {
          alert(`Exporting assessment for ${state.currentAssessment.innovationName} to PDF`);
        }
      });
    }
    
    const shareAssessmentBtn = document.getElementById('share-assessment');
    if (shareAssessmentBtn) {
      shareAssessmentBtn.addEventListener('click', () => {
        if (state.currentAssessment) {
          const email = prompt('Enter email address to share with:');
          if (email) {
            alert(`Assessment for ${state.currentAssessment.innovationName} would be shared with ${email}`);
          }
        }
      });
    }
  }

  // Helper for throttling input events
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Export data to CSV
  function exportAssessmentsToCSV() {
    const assessments = getFilteredAssessments();
    
    if (assessments.length === 0) {
      alert('No assessments to export');
      return;
    }
    
    // Prepare CSV header
    const headers = [
      'Innovation Name',
      'Problem Value',
      'Solution Fit',
      'Value for Money',
      'Total Score',
      'Completed Date',
      'Session ID'
    ];
    
    // Prepare CSV rows
    const rows = assessments.map(a => [
      a.innovationName,
      a.problemValue,
      a.solutionFit,
      a.valueForMoney,
      a.totalScore,
      new Date(a.completed).toISOString().split('T')[0], // Format as YYYY-MM-DD
      a.sessionId
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scout-spotlight-assessments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Initialize the application
  function init() {
    setupEventListeners();
    
    // Check if logged in
    if (state.apiKey) {
      elements.loginScreen.classList.add('hidden');
      elements.dashboardScreen.classList.remove('hidden');
      loadDashboard();
    }
    
    // Initialize the sessionsCurrentPage property
    state.sessionsCurrentPage = 1;
    
    // Initialize Lucide icons if available
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // Start the application
  init();
});