// admin.js - SCOUT Spotlight Admin Dashboard functionality

document.addEventListener('DOMContentLoaded', () => {
  // State management
  const state = {
    apiKey: localStorage.getItem('adminApiKey') || '',
    activeTab: 'sessions',
    sessions: [],
    assessments: [],
    currentSession: null,
    currentAssessment: null,
    currentPage: 1,
    pageSize: 10,
    workshopFilter: ''
  };

  // DOM elements
  const elements = {
    loginScreen: document.getElementById('login-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    loginForm: document.getElementById('login-form'),
    logoutButton: document.getElementById('logout-button'),
    tabSessions: document.getElementById('tab-sessions'),
    tabAssessments: document.getElementById('tab-assessments'),
    sessionsPanel: document.getElementById('sessions-panel'),
    assessmentsPanel: document.getElementById('assessments-panel'),
    conversationPanel: document.getElementById('conversation-panel'),
    assessmentDetailPanel: document.getElementById('assessment-detail-panel'),
    sessionsTableBody: document.getElementById('sessions-table-body'),
    assessmentsTableBody: document.getElementById('assessments-table-body'),
    conversationMessages: document.getElementById('conversation-messages'),
    conversationMetadata: document.getElementById('conversation-metadata'),
    assessmentMetadata: document.getElementById('assessment-metadata'),
    backToSessions: document.getElementById('back-to-sessions'),
    backToAssessments: document.getElementById('back-to-assessments'),
    workshopFilter: document.getElementById('workshop-filter'),
    applyFilter: document.getElementById('apply-filter'),
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    pageInfo: document.getElementById('page-info'),
    totalSessions: document.getElementById('total-sessions'),
    completedAssessments: document.getElementById('completed-assessments'),
    averageScore: document.getElementById('average-score'),
    highestRated: document.getElementById('highest-rated'),
    loadingOverlay: document.getElementById('loading-overlay'),
    exportAssessmentPdf: document.getElementById('export-assessment-pdf')
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
        // Updated to use the new API routes without the /admin/ prefix
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
    async getSessions(workshopFilter = '') {
      const query = workshopFilter ? `?workshopId=${encodeURIComponent(workshopFilter)}` : '';
      return await this.call(`sessions${query}`);
    },
    
    // Get all assessments
    async getAssessments() {
      return await this.call('assessments');
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
      await Promise.all([
        loadStats(),
        loadSessions(),
        loadAssessments()
      ]);
      
      // Set active tab display
      updateTabDisplay();
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
        updateStatsDisplay(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadSessions() {
    try {
      const data = await api.getSessions(state.workshopFilter);
      if (data && data.sessions) {
        state.sessions = data.sessions;
        renderSessionsTable();
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  async function loadAssessments() {
    try {
      const data = await api.getAssessments();
      if (data && data.assessments) {
        state.assessments = data.assessments;
        renderAssessmentsTable();
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  }

  // UI Rendering Functions
  function updateStatsDisplay(stats) {
    elements.totalSessions.textContent = stats.totalSessions || 0;
    elements.completedAssessments.textContent = stats.completedAssessments || 0;
    elements.averageScore.textContent = `${stats.averageScore || 0}/15`;
    
    if (stats.highestRated) {
      elements.highestRated.textContent = `${stats.highestRated.innovationName} (${stats.highestRated.score || stats.highestRated.totalScore}/15)`;
    } else {
      elements.highestRated.textContent = 'None';
    }
  }

  function renderSessionsTable() {
    const sessionsToShow = getPaginatedSessions();
    elements.sessionsTableBody.innerHTML = '';
    
    if (sessionsToShow.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="7" class="text-center">No sessions found</td>`;
      elements.sessionsTableBody.appendChild(emptyRow);
    } else {
      sessionsToShow.forEach(session => {
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
            <button class="view-button" data-session-id="${session.sessionId || session.id}">View</button>
          </td>
        `;
        elements.sessionsTableBody.appendChild(row);
      });
      
      // Add event listeners to view buttons
      document.querySelectorAll('.view-button[data-session-id]').forEach(button => {
        button.addEventListener('click', () => {
          const sessionId = button.getAttribute('data-session-id');
          viewSession(sessionId);
        });
      });
    }
    
    updatePagination();
  }

  function renderAssessmentsTable() {
    elements.assessmentsTableBody.innerHTML = '';
    
    if (state.assessments.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="7" class="text-center">No assessments found</td>`;
      elements.assessmentsTableBody.appendChild(emptyRow);
    } else {
      state.assessments.forEach(assessment => {
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
            <button class="view-button" data-assessment-id="${assessment._id || assessment.id}">View</button>
          </td>
        `;
        elements.assessmentsTableBody.appendChild(row);
      });
      
      // Add event listeners to view buttons
      document.querySelectorAll('.view-button[data-assessment-id]').forEach(button => {
        button.addEventListener('click', () => {
          const assessmentId = button.getAttribute('data-assessment-id');
          viewAssessment(assessmentId);
        });
      });
    }
  }

  // Session and Assessment Detail Views
  async function viewSession(sessionId) {
    showLoading();
    
    try {
      const data = await api.getConversation(sessionId);
      
      if (data && data.session) {
        state.currentSession = data.session;
        renderConversationDetails(data.session, data.messages || []);
        
        hideAllPanels();
        elements.conversationPanel.classList.remove('hidden');
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
        
        hideAllPanels();
        elements.assessmentDetailPanel.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error viewing assessment:', error);
      showError('Failed to load assessment details');
    } finally {
      hideLoading();
    }
  }

function renderConversationDetails(session, messages) {
  // Metadata
  elements.conversationMetadata.innerHTML = `
    <div>
      <p><strong>Session ID:</strong> <span>${session.sessionId || session.id}</span></p>
      <p><strong>Innovation:</strong> <span>${session.innovationName}</span></p>
      <p><strong>Created:</strong> <span>${formatDate(session.created)}</span></p>
      <p><strong>Last Activity:</strong> <span>${formatDate(session.lastActivity)}</span></p>
      <p><strong>Workshop ID:</strong> <span>${session.workshopId || 'None'}</span></p>
    </div>
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
    // Metadata
    elements.assessmentMetadata.innerHTML = `
      <h3>${assessment.innovationName}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <p><strong>Completed:</strong> <span>${formatDate(assessment.completed)}</span></p>
        <p><strong>Session ID:</strong> <span>${assessment.sessionId}</span></p>
      </div>
    `;
    
    // Score cards
    const scoresGrid = document.querySelector('.scores-grid');
    scoresGrid.innerHTML = `
      <div class="score-card">
        <div class="score-title">Problem Value</div>
        <div class="score-value">${assessment.problemValue}/5</div>
      </div>
      <div class="score-card">
        <div class="score-title">Solution Fit</div>
        <div class="score-value">${assessment.solutionFit}/5</div>
      </div>
      <div class="score-card">
        <div class="score-title">Value for Money</div>
        <div class="score-value">${assessment.valueForMoney}/5</div>
      </div>
    `;
    
    // Total score
    const totalScoreBox = document.getElementById('total-score-box');
    totalScoreBox.innerHTML = `
      <h4>Total Score</h4>
      <div>
        <span class="text-2xl font-bold">${assessment.totalScore}/15</span>
        <span class="score-badge ${getScoreBadgeClass(assessment.totalScore, 'total')}">
          ${getScoreLabel(assessment.totalScore)}
        </span>
      </div>
    `;
    
    // Recommendation
    const recommendationText = document.getElementById('recommendation-text');
    recommendationText.textContent = assessment.recommendation || 'No recommendation available';
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

  function getScoreLabel(score) {
    if (score >= 12) return 'High Quality';
    if (score >= 8) return 'Promising';
    return 'Needs Development';
  }

  function getPaginatedSessions() {
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return state.sessions.slice(startIndex, endIndex);
  }

  function updatePagination() {
    const totalPages = Math.ceil(state.sessions.length / state.pageSize);
    elements.prevPage.disabled = state.currentPage <= 1;
    elements.nextPage.disabled = state.currentPage >= totalPages;
    
    const startItem = (state.currentPage - 1) * state.pageSize + 1;
    const endItem = Math.min(startItem + state.pageSize - 1, state.sessions.length);
    
    if (state.sessions.length === 0) {
      elements.pageInfo.textContent = '0-0 of 0';
    } else {
      elements.pageInfo.textContent = `${startItem}-${endItem} of ${state.sessions.length}`;
    }
  }

  function hideAllPanels() {
    elements.sessionsPanel.classList.add('hidden');
    elements.assessmentsPanel.classList.add('hidden');
    elements.conversationPanel.classList.add('hidden');
    elements.assessmentDetailPanel.classList.add('hidden');
  }

  function updateTabDisplay() {
    // Update tab buttons
    elements.tabSessions.classList.toggle('active', state.activeTab === 'sessions');
    elements.tabAssessments.classList.toggle('active', state.activeTab === 'assessments');
    
    // Show the active panel
    hideAllPanels();
    
    if (state.activeTab === 'sessions') {
      elements.sessionsPanel.classList.remove('hidden');
    } else if (state.activeTab === 'assessments') {
      elements.assessmentsPanel.classList.remove('hidden');
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
    alert(message); // Basic error handling - could be improved with a modal
  }

  // Event Handlers
  // This is the missing function that was causing the error
  function setupEventListeners() {
    // Login form submission
    elements.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const apiKeyInput = document.getElementById('api-key');
      login(apiKeyInput.value);
    });
    
    // Logout button
    elements.logoutButton.addEventListener('click', logout);
    
    // Tab navigation
    elements.tabSessions.addEventListener('click', () => {
      state.activeTab = 'sessions';
      updateTabDisplay();
    });
    
    elements.tabAssessments.addEventListener('click', () => {
      state.activeTab = 'assessments';
      updateTabDisplay();
    });
    
    // Filter application
    elements.applyFilter.addEventListener('click', () => {
      state.workshopFilter = elements.workshopFilter.value;
      state.currentPage = 1; // Reset to first page when filtering
      loadSessions();
    });
    
    // Pagination
    elements.prevPage.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderSessionsTable();
      }
    });
    
    elements.nextPage.addEventListener('click', () => {
      const totalPages = Math.ceil(state.sessions.length / state.pageSize);
      if (state.currentPage < totalPages) {
        state.currentPage++;
        renderSessionsTable();
      }
    });
    
    // Back buttons
    elements.backToSessions.addEventListener('click', () => {
      state.currentSession = null;
      hideAllPanels();
      elements.sessionsPanel.classList.remove('hidden');
    });
    
    elements.backToAssessments.addEventListener('click', () => {
      state.currentAssessment = null;
      hideAllPanels();
      elements.assessmentsPanel.classList.remove('hidden');
    });
    
    // Export PDF
    elements.exportAssessmentPdf.addEventListener('click', () => {
      alert('Export to PDF functionality is not implemented yet.');
    });
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
  }

  init();
});