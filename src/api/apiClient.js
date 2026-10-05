const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const WAKE_TIMEOUT_MS = 45000;
const RETRY_DELAY_MS = 500;


const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// Normalize MongoDB doc to match Base44 field names the frontend already uses
const normalize = (doc) => {
  if (!doc || typeof doc !== 'object') return doc;
  return {
    ...doc,
    id: doc._id || doc.id,
    created_date: doc.createdAt || doc.created_date,
    updated_date: doc.updatedAt || doc.updated_date,
  };
};

const normalizeResult = (data) => Array.isArray(data) ? data.map(normalize) : normalize(data);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const wakeBackend = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WAKE_TIMEOUT_MS);

  try {
    await fetch(`${API_BASE}/`, { signal: controller.signal, cache: 'no-store' });
  } catch (_) {
    // The normal API request will show the final error if the backend stays unavailable.
  } finally {
    clearTimeout(timeout);
  }
};

const fetchWithWakeup = async (url, options) => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(url, options);
      if (res.ok || ![502, 503, 504].includes(res.status) || attempt === 1) return res;
    } catch (error) {
      if (attempt === 1) throw error;
    }

    await wakeBackend();
    await wait(RETRY_DELAY_MS);
  }
};

const request = async (method, path, body) => {
  let res;
  try {
    res = await fetchWithWakeup(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  } catch (cause) {
    const error = new Error('Server is waking up. Please try again in a moment.');
    error.cause = cause;
    throw error;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const error = new Error(err.message || 'Request failed');
    error.status = res.status;
    throw error;
  }
  const data = await res.json();
  return normalizeResult(data);
};

const requestMultipart = async (method, path, formData) => {
  let res;
  try {
    res = await fetchWithWakeup(`${API_BASE}${path}`, {
      method,
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: formData,
    });
  } catch (cause) {
    const error = new Error('Server is waking up. Please try again in a moment.');
    error.cause = cause;
    throw error;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const error = new Error(err.message || 'Request failed');
    error.status = res.status;
    throw error;
  }
  return normalizeResult(await res.json());
};

const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  let res;
  try {
    res = await fetchWithWakeup(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: formData,
    });
  } catch (cause) {
    const error = new Error('Server is waking up. Please try again in a moment.');
    error.cause = cause;
    throw error;
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Upload request failed:', res.status, errorData);
    const error = new Error(errorData.message || `Upload failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// One simple entity factory — flat routes, company_id as query param or body field
const entity = (resource) => ({
  list: (sort) => {
    const qs = sort ? `?sort=${sort}` : '';
    return request('GET', `/api/${resource}${qs}`);
  },
  filter: (params, sort, limit) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && qs.set(k, v));
    if (sort) qs.set('sort', sort);
    if (limit) qs.set('limit', limit);
    return request('GET', `/api/${resource}?${qs}`);
  },
  create: (data) => request('POST', `/api/${resource}`, data),
  update: (id, data) => request('PUT', `/api/${resource}/${id}`, data),
  createMultipart: (formData) => requestMultipart('POST', `/api/${resource}`, formData),
  updateMultipart: (id, formData) => requestMultipart('PUT', `/api/${resource}/${id}`, formData),
  delete: (id) => request('DELETE', `/api/${resource}/${id}`),
  subscribe: (cb) => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      try { cb({ data: await request('GET', `/api/${resource}`) }); } catch (_) {}
      if (active) setTimeout(poll, 2500);
    };
    poll();
    return () => { active = false; };
  },
});

const USER_KEY = 'user';
const ACTIVE_COMPANY_KEY = 'activeCompanyId';
const WELCOME_KEY = 'showWelcomeModal';

export const api = {
  auth: {
    me: () => request('GET', '/api/auth/me'),
    login: (email, password) => request('POST', '/api/auth/login', { email, password }),
    register: (data) => request('POST', '/api/auth/register', data),
    verifyOtp: (email, otp) => request('POST', '/api/auth/verify-otp', { email, otp }),
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(WELCOME_KEY);
    },
    
    redirectToLogin: () => { window.location.href = '/login'; },
    setToken: (token) => localStorage.setItem('token', token),
    getToken,
    setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
    getUser: () => {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    
    saveSession: (result) => {
      if (result?.token) localStorage.setItem('token', result.token);
      if (result) localStorage.setItem(USER_KEY, JSON.stringify(result));
    },
    setWelcomeModal: (show) => {
      if (show) localStorage.setItem(WELCOME_KEY, 'true');
      else localStorage.removeItem(WELCOME_KEY);
    },
    shouldShowWelcome: () => localStorage.getItem(WELCOME_KEY) === 'true',
    setActiveCompanyId: (id) => {
      if (id) localStorage.setItem(ACTIVE_COMPANY_KEY, id);
      else localStorage.removeItem(ACTIVE_COMPANY_KEY);
    },
    getActiveCompanyId: () => localStorage.getItem(ACTIVE_COMPANY_KEY),
  },
  profile: {
    update: (data) =>
      request("PUT", "/api/auth/profile", data),

    getSubscription: (userId) =>
      request("GET", `/api/billing/subscription/${userId}`),
  },

  entities: {
    Company:     entity('companies'),
    Expense:     entity('expenses'),
    Invoice:     entity('invoices'),
    Investor:    entity('investors'),
    Client:      entity('clients'),
    Property:    entity('properties'),
    Employee:    entity('employees'),
    Note:        entity('notes'),
    Idea:        entity('ideas'),
    IdeaComment: entity('idea-comments'),
    Event: {
    ...entity('events'),

    getByCompanyId:(companyId)=>
      request(
        "GET",
        `/api/events/company/${companyId}`
      ),
  },

    Activity: {
  ...entity('activities'),
  deleteCompanyActivities: (companyId) =>
    request('DELETE', `/api/activities/company/${companyId}`),
},
    ChatMessage: entity('chat'),
    Document:    entity('documents'),
    DocSection:  entity('doc-sections'),
    Password:    entity('passwords'),
    BusinessPlan: entity('business-plan'),
    Step:         entity('steps'),
    Contract:     entity('contracts'),
      Goal: entity('goals'),
      Hpc: entity('hpcs'),

  },
  
  invitations: {
    getMine: () => request('GET', '/api/invitations'),
    accept: (id, contractAgreed) => request('PUT', `/api/invitations/${id}/accept`, { contract_agreed: contractAgreed }),
    reject: (id) => request('PUT', `/api/invitations/${id}/reject`),
  },
  integrations: {
    Core: {
      UploadFile: ({ file }) => uploadFile(file),
      SendEmail: (params) => request('POST', '/api/send-email', params),
      ExtractDataFromUploadedFile: async () => ({ data: [] }),
      InvokeLLM: async () => ({ content: '' }),
    },
  },
  functions: {
    invoke: (name, params) => request('POST', `/api/functions/${name}`, params),
  },
};

export default api;
