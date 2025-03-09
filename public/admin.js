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

  // Rest of the code remains the same
  
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

  // ... (rest of the existing code)

  // Initialize
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