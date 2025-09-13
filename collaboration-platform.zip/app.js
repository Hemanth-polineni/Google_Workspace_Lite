// Application State
let currentUser = null;
let currentDocument = null;
let documents = [];
let isEditorActive = false;
let typingTimer = null;
let saveTimer = null;
let ghostUserTimers = [];

// Sample data with current timestamp
const sampleDocuments = [
    {
        "id": "doc-1",
        "title": "Project Planning Notes",
        "content": "# Project Planning Session\n\nWelcome to our collaborative project planning document. This is where we'll outline our goals, milestones, and next steps.\n\n## Project Overview\nOur team is working on building a real-time collaborative platform...",
        "lastModified": Date.now() - 3600000, // 1 hour ago
        "collaborators": [
            {
                "id": "user-1",
                "name": "Alice Chen",
                "color": "#3B82F6",
                "isOnline": true,
                "lastSeen": Date.now() - 300000, // 5 minutes ago
                "cursorPosition": 45
            },
            {
                "id": "user-2", 
                "name": "Bob Wilson",
                "color": "#EF4444",
                "isOnline": false,
                "lastSeen": Date.now() - 7200000, // 2 hours ago
                "cursorPosition": 120
            }
        ],
        "version": 3
    },
    {
        "id": "doc-2",
        "title": "Meeting Notes - September 2025",
        "content": "# Team Meeting Notes\n\n**Date:** September 13, 2025\n**Attendees:** Development Team\n\n## Agenda Items\n1. Review current progress\n2. Discuss upcoming features\n3. Plan next sprint\n\n## Key Decisions\n- Implement real-time collaboration\n- Focus on user experience improvements",
        "lastModified": Date.now() - 1800000, // 30 minutes ago
        "collaborators": [
            {
                "id": "user-3",
                "name": "Carol Davis",
                "color": "#10B981",
                "isOnline": true,
                "lastSeen": Date.now() - 60000, // 1 minute ago
                "cursorPosition": 200
            }
        ],
        "version": 2
    }
];

const userColors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];
const ghostUsers = [
    {"name": "David Kim", "color": "#F59E0B"},
    {"name": "Emma Taylor", "color": "#8B5CF6"}, 
    {"name": "Frank Miller", "color": "#EC4899"},
    {"name": "Grace Johnson", "color": "#06B6D4"}
];

// DOM Elements
const nameModal = document.getElementById('nameModal');
const userNameInput = document.getElementById('userNameInput');
const setNameBtn = document.getElementById('setNameBtn');
const dashboard = document.getElementById('dashboard');
const currentUserName = document.getElementById('currentUserName');
const changeNameBtn = document.getElementById('changeNameBtn');
const createDocBtn = document.getElementById('createDocBtn');
const documentsGrid = document.getElementById('documentsGrid');
const editorContainer = document.getElementById('editorContainer');
const backToDashboard = document.getElementById('backToDashboard');
const documentTitle = document.getElementById('documentTitle');
const documentEditor = document.getElementById('documentEditor');
const onlineUsers = document.getElementById('onlineUsers');
const connectionStatus = document.getElementById('connectionStatus');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const lastSaved = document.getElementById('lastSaved');
const typingIndicators = document.getElementById('typingIndicators');
const deleteModal = document.getElementById('deleteModal');
const deleteDocTitle = document.getElementById('deleteDocTitle');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Toolbar elements
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const underlineBtn = document.getElementById('underlineBtn');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const deleteDocBtn = document.getElementById('deleteDocBtn');

// Initialize Application
function initApp() {
    loadDocumentsFromStorage();
    loadCurrentUser();
    
    if (!currentUser) {
        showNameModal();
    } else {
        showDashboard();
    }
    
    setupEventListeners();
    startGhostUserSimulation();
}

// Local Storage Functions
function saveDocumentsToStorage() {
    localStorage.setItem('collabdocs_documents', JSON.stringify(documents));
}

function loadDocumentsFromStorage() {
    const stored = localStorage.getItem('collabdocs_documents');
    if (stored) {
        documents = JSON.parse(stored);
    } else {
        documents = [...sampleDocuments];
        saveDocumentsToStorage();
    }
}

function saveCurrentUser() {
    if (currentUser) {
        localStorage.setItem('collabdocs_user', JSON.stringify(currentUser));
    }
}

function loadCurrentUser() {
    const stored = localStorage.getItem('collabdocs_user');
    if (stored) {
        currentUser = JSON.parse(stored);
        if (currentUserName) {
            currentUserName.textContent = currentUser.name;
        }
    }
}

// User Management
function createUser(name) {
    return {
        id: 'user-' + Date.now(),
        name: name.trim(),
        color: userColors[Math.floor(Math.random() * userColors.length)],
        isOnline: true,
        lastSeen: Date.now(),
        cursorPosition: 0
    };
}

function setUserName() {
    const name = userNameInput.value.trim();
    if (!name) {
        showToast('Please enter your name', 'error');
        userNameInput.focus();
        return;
    }
    
    currentUser = createUser(name);
    saveCurrentUser();
    currentUserName.textContent = currentUser.name;
    hideNameModal();
    showDashboard();
    showToast(`Welcome, ${name}!`, 'success');
}

// Modal Functions
function showNameModal() {
    nameModal.classList.remove('hidden');
    // Fix focus issue by using setTimeout
    setTimeout(() => {
        userNameInput.focus();
        userNameInput.select();
    }, 100);
}

function hideNameModal() {
    nameModal.classList.add('hidden');
    userNameInput.value = '';
}

function showDeleteModal(docId) {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
        deleteDocTitle.textContent = doc.title;
        deleteModal.classList.remove('hidden');
        deleteModal.dataset.docId = docId;
    }
}

function hideDeleteModal() {
    deleteModal.classList.add('hidden');
    delete deleteModal.dataset.docId;
}

// Dashboard Functions
function showDashboard() {
    dashboard.classList.remove('hidden');
    editorContainer.classList.add('hidden');
    isEditorActive = false;
    renderDocuments();
    clearGhostUserTimers();
}

function renderDocuments() {
    documentsGrid.innerHTML = '';
    
    documents.forEach(doc => {
        const card = createDocumentCard(doc);
        documentsGrid.appendChild(card);
    });
}

function createDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'document-card';
    
    const preview = doc.content.replace(/[#*]/g, '').substring(0, 150) + '...';
    const lastModified = new Date(doc.lastModified).toLocaleDateString();
    
    card.innerHTML = `
        <div class="document-card-header">
            <h3 class="document-title-text">${doc.title}</h3>
        </div>
        <div class="document-preview">${preview}</div>
        <div class="document-meta">
            <span>Modified ${lastModified}</span>
            <div class="document-collaborators">
                ${doc.collaborators.map(collab => 
                    `<div class="collaborator-avatar ${collab.isOnline ? 'online' : ''}" 
                          style="background-color: ${collab.color}" 
                          title="${collab.name}">
                        ${collab.name.charAt(0).toUpperCase()}
                     </div>`
                ).join('')}
            </div>
        </div>
    `;
    
    // Fix: Add proper click event listener
    card.addEventListener('click', (e) => {
        e.preventDefault();
        openDocument(doc.id);
    });
    
    return card;
}

// Document Management
function createNewDocument() {
    const newDoc = {
        id: 'doc-' + Date.now(),
        title: 'Untitled Document',
        content: '',
        lastModified: Date.now(),
        collaborators: [{
            ...currentUser,
            cursorPosition: 0
        }],
        version: 1
    };
    
    documents.unshift(newDoc);
    saveDocumentsToStorage();
    openDocument(newDoc.id);
    showToast('New document created', 'success');
}

function openDocument(docId) {
    const doc = documents.find(d => d.id === docId);
    if (!doc) {
        showToast('Document not found', 'error');
        return;
    }
    
    currentDocument = doc;
    
    // Add current user as collaborator if not already present
    if (!doc.collaborators.find(c => c.id === currentUser.id)) {
        doc.collaborators.push({
            ...currentUser,
            cursorPosition: 0
        });
        saveDocumentsToStorage();
    } else {
        // Update user online status
        const userCollab = doc.collaborators.find(c => c.id === currentUser.id);
        if (userCollab) {
            userCollab.isOnline = true;
            userCollab.lastSeen = Date.now();
        }
    }
    
    showEditor();
    loadDocumentContent();
    updateDocumentStats();
    renderOnlineUsers();
    startGhostUserActivity();
}

function showEditor() {
    dashboard.classList.add('hidden');
    editorContainer.classList.remove('hidden');
    isEditorActive = true;
    setTimeout(() => {
        documentEditor.focus();
    }, 100);
}

function loadDocumentContent() {
    documentTitle.value = currentDocument.title;
    documentEditor.innerHTML = formatContentForDisplay(currentDocument.content);
    updateLastSaved();
}

function formatContentForDisplay(content) {
    return content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>');
}

function saveDocument() {
    if (!currentDocument) return;
    
    currentDocument.title = documentTitle.value || 'Untitled Document';
    currentDocument.content = getPlainTextContent();
    currentDocument.lastModified = Date.now();
    currentDocument.version++;
    
    saveDocumentsToStorage();
    updateLastSaved();
    showToast('Document saved', 'success');
}

function deleteCurrentDocument() {
    if (!currentDocument) return;
    
    const docId = currentDocument.id;
    documents = documents.filter(d => d.id !== docId);
    saveDocumentsToStorage();
    
    hideDeleteModal();
    showDashboard();
    showToast('Document deleted', 'success');
}

function exportDocument() {
    if (!currentDocument) return;
    
    const content = currentDocument.content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Document exported', 'success');
}

// Text Editor Functions
function getPlainTextContent() {
    return documentEditor.innerText || documentEditor.textContent || '';
}

function updateDocumentStats() {
    const text = getPlainTextContent();
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

function updateLastSaved() {
    const now = new Date();
    lastSaved.textContent = `Saved at ${now.toLocaleTimeString()}`;
}

function applyFormat(command, value = null) {
    document.execCommand(command, false, value);
    documentEditor.focus();
    
    // Update button states
    updateToolbarState();
    
    // Save changes
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveDocument();
        simulateCollaborativeChange();
    }, 1000);
}

function updateToolbarState() {
    boldBtn.classList.toggle('active', document.queryCommandState('bold'));
    italicBtn.classList.toggle('active', document.queryCommandState('italic'));
    underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
}

// Collaborative Features
function renderOnlineUsers() {
    if (!currentDocument) return;
    
    onlineUsers.innerHTML = '';
    const onlineCollaborators = currentDocument.collaborators.filter(c => c.isOnline);
    
    onlineCollaborators.forEach(collab => {
        const avatar = document.createElement('div');
        avatar.className = 'collaborator-avatar online';
        avatar.style.backgroundColor = collab.color;
        avatar.textContent = collab.name.charAt(0).toUpperCase();
        avatar.title = collab.name;
        onlineUsers.appendChild(avatar);
    });
}

function simulateTypingIndicator(userName, color) {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `<span style="color: ${color}">${userName}</span> is typing...`;
    typingIndicators.appendChild(indicator);
    
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 2000 + Math.random() * 3000);
}

function simulateCollaborativeChange() {
    if (!isEditorActive || !currentDocument) return;
    
    const ghostUser = ghostUsers[Math.floor(Math.random() * ghostUsers.length)];
    
    // Show typing indicator
    simulateTypingIndicator(ghostUser.name, ghostUser.color);
    
    // Add random change after delay
    setTimeout(() => {
        if (!isEditorActive) return;
        
        const changes = [
            ' (updated by ' + ghostUser.name + ')',
            '\n\n• New point added by ' + ghostUser.name,
            ' - ' + ghostUser.name + ' was here'
        ];
        
        const randomChange = changes[Math.floor(Math.random() * changes.length)];
        
        // Add the change
        documentEditor.innerHTML += randomChange.replace(/\n/g, '<br>');
        
        // Highlight the change
        highlightRecentChange();
        
        showToast(`${ghostUser.name} made an edit`, 'info');
        updateDocumentStats();
    }, 1000 + Math.random() * 2000);
}

function highlightRecentChange() {
    // This is a simplified version - in a real app, you'd track specific text ranges
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'recent-change';
        try {
            range.surroundContents(span);
        } catch (e) {
            // Ignore errors for now
        }
    }
}

function startGhostUserActivity() {
    if (!isEditorActive) return;
    
    // Simulate ghost users joining
    setTimeout(() => {
        if (!isEditorActive || !currentDocument) return;
        
        const ghostUser = ghostUsers[Math.floor(Math.random() * ghostUsers.length)];
        
        // Add ghost user to collaborators if not present
        if (!currentDocument.collaborators.find(c => c.name === ghostUser.name)) {
            currentDocument.collaborators.push({
                id: 'ghost-' + Date.now(),
                name: ghostUser.name,
                color: ghostUser.color,
                isOnline: true,
                lastSeen: Date.now(),
                cursorPosition: Math.floor(Math.random() * 100)
            });
            
            renderOnlineUsers();
            showToast(`${ghostUser.name} joined the document`, 'info');
        }
    }, 3000 + Math.random() * 5000);
    
    // Schedule periodic collaborative changes
    const timer = setInterval(() => {
        if (!isEditorActive) {
            clearInterval(timer);
            return;
        }
        simulateCollaborativeChange();
    }, 10000 + Math.random() * 20000);
    
    ghostUserTimers.push(timer);
}

function startGhostUserSimulation() {
    // Periodically update online status of ghost users in all documents
    setInterval(() => {
        documents.forEach(doc => {
            doc.collaborators.forEach(collab => {
                if (collab.id.startsWith('ghost-')) {
                    // Randomly toggle online status
                    collab.isOnline = Math.random() > 0.3;
                    collab.lastSeen = Date.now() - Math.random() * 3600000;
                }
            });
        });
        
        if (currentDocument) {
            renderOnlineUsers();
        }
    }, 30000); // Every 30 seconds
}

function clearGhostUserTimers() {
    ghostUserTimers.forEach(timer => clearInterval(timer));
    ghostUserTimers = [];
}

// Toast Notifications
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Event Listeners
function setupEventListeners() {
    // Name modal
    setNameBtn.addEventListener('click', setUserName);
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setUserName();
        }
    });
    
    // Fix: Add proper focus handling for name input
    userNameInput.addEventListener('click', () => {
        userNameInput.focus();
    });
    
    // Dashboard
    changeNameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showNameModal();
    });
    
    createDocBtn.addEventListener('click', (e) => {
        e.preventDefault();
        createNewDocument();
    });
    
    backToDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
    });
    
    // Document editor
    documentTitle.addEventListener('input', () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveDocument, 1000);
    });
    
    documentEditor.addEventListener('input', () => {
        updateDocumentStats();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveDocument, 2000);
    });
    
    documentEditor.addEventListener('keydown', (e) => {
        // Simulate typing indicator for current user
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            // Stop typing indicator
        }, 1000);
    });
    
    // Toolbar
    boldBtn.addEventListener('click', (e) => {
        e.preventDefault();
        applyFormat('bold');
    });
    
    italicBtn.addEventListener('click', (e) => {
        e.preventDefault();
        applyFormat('italic');
    });
    
    underlineBtn.addEventListener('click', (e) => {
        e.preventDefault();
        applyFormat('underline');
    });
    
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveDocument();
    });
    
    exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportDocument();
    });
    
    deleteDocBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentDocument) {
            showDeleteModal(currentDocument.id);
        }
    });
    
    // Delete modal
    confirmDeleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        deleteCurrentDocument();
    });
    
    cancelDeleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideDeleteModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    if (currentDocument) {
                        saveDocument();
                    }
                    break;
                case 'b':
                    if (isEditorActive) {
                        e.preventDefault();
                        applyFormat('bold');
                    }
                    break;
                case 'i':
                    if (isEditorActive) {
                        e.preventDefault();
                        applyFormat('italic');
                    }
                    break;
                case 'u':
                    if (isEditorActive) {
                        e.preventDefault();
                        applyFormat('underline');
                    }
                    break;
                case 'n':
                    if (!isEditorActive) {
                        e.preventDefault();
                        createNewDocument();
                    }
                    break;
            }
        }
        
        // ESC key to close modals
        if (e.key === 'Escape') {
            if (!nameModal.classList.contains('hidden') && currentUser) {
                hideNameModal();
            }
            if (!deleteModal.classList.contains('hidden')) {
                hideDeleteModal();
            }
        }
    });
    
    // Close modals on outside click
    nameModal.addEventListener('click', (e) => {
        if (e.target === nameModal && currentUser) {
            hideNameModal();
        }
    });
    
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            hideDeleteModal();
        }
    });
    
    // Update toolbar state on selection change
    document.addEventListener('selectionchange', () => {
        if (isEditorActive) {
            updateToolbarState();
        }
    });
    
    // Auto-save on page unload
    window.addEventListener('beforeunload', () => {
        if (currentDocument) {
            saveDocument();
        }
        
        // Mark current user as offline
        if (currentUser) {
            documents.forEach(doc => {
                const userCollab = doc.collaborators.find(c => c.id === currentUser.id);
                if (userCollab) {
                    userCollab.isOnline = false;
                    userCollab.lastSeen = Date.now();
                }
            });
            saveDocumentsToStorage();
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);