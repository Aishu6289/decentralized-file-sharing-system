// Global variables
let currentUser = null;
let authToken = null;

// DOM elements
const authSection = document.getElementById('auth-section');
const userDashboard = document.getElementById('user-dashboard');
const adminDashboard = document.getElementById('admin-dashboard');
const userInfo = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize floating particles
    createFloatingParticles();
});

function setupEventListeners() {
    // Auth forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // File upload
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Admin code check
    document.getElementById('check-code-form').addEventListener('submit', handleCodeCheck);
    
    // Clear file display when admin starts entering new code
    document.getElementById('upload-code-input').addEventListener('focus', function() {
        const fileDisplayCard = document.getElementById('file-display-card');
        const resultDiv = document.getElementById('code-result');
        fileDisplayCard.classList.add('hidden');
        resultDiv.classList.add('hidden');
    });
    
    // File action buttons (using event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-file-btn')) {
            const fileId = e.target.closest('.view-file-btn').getAttribute('data-file-id');
            viewFile(fileId);
        } else if (e.target.closest('.download-file-btn')) {
            const fileId = e.target.closest('.download-file-btn').getAttribute('data-file-id');
            downloadFile(fileId);
        }
    });
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.token;
            currentUser = data.data.user;
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showDashboard();
            showAlert('Login successful!', 'success');
        } else {
            showAlert(data.message, 'danger');
        }
    } catch (error) {
        showAlert('Login failed. Please try again.', 'danger');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, role })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.token;
            currentUser = data.data.user;
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showDashboard();
            showAlert('Registration successful!', 'success');
        } else {
            showAlert(data.message, 'danger');
        }
    } catch (error) {
        showAlert('Registration failed. Please try again.', 'danger');
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    authSection.classList.remove('hidden');
    userDashboard.classList.add('hidden');
    adminDashboard.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    userInfo.textContent = '';
    
    // Hide file display card and clear admin files list
    const fileDisplayCard = document.getElementById('file-display-card');
    const adminFilesList = document.getElementById('admin-files-list');
    if (fileDisplayCard) {
        fileDisplayCard.classList.add('hidden');
    }
    if (adminFilesList) {
        adminFilesList.innerHTML = '<p class="text-muted">Enter a code to view file details</p>';
    }
    
    // Clear forms
    document.getElementById('login-form').reset();
    document.getElementById('signup-form').reset();
}

function showDashboard() {
    authSection.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userInfo.textContent = `${currentUser.username} (${currentUser.role})`;
    
    if (currentUser.role === 'admin') {
        adminDashboard.classList.remove('hidden');
        // Ensure file display card is hidden by default
        const fileDisplayCard = document.getElementById('file-display-card');
        if (fileDisplayCard) {
            fileDisplayCard.classList.add('hidden');
        }
        // Don't load all files by default for admin
        // loadAdminFiles();
    } else {
        userDashboard.classList.remove('hidden');
        loadUserFiles();
    }
}

// File upload functions
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const progressDiv = document.getElementById('upload-progress');
    const resultDiv = document.getElementById('upload-result');
    
    // Show progress
    progressDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success
            progressDiv.classList.add('hidden');
            resultDiv.classList.remove('hidden');
            document.getElementById('upload-code').textContent = data.data.uploadCode;
            
            // Reload user files
            loadUserFiles();
            
            showAlert('File uploaded successfully!', 'success');
        } else {
            progressDiv.classList.add('hidden');
            showAlert(data.message, 'danger');
        }
    } catch (error) {
        progressDiv.classList.add('hidden');
        showAlert('Upload failed. Please try again.', 'danger');
    }
}

// Admin functions
async function handleCodeCheck(e) {
    e.preventDefault();
    
    const uploadCode = document.getElementById('upload-code-input').value;
    const resultDiv = document.getElementById('code-result');
    
    try {
        const response = await fetch('/api/files/check-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ uploadCode })
        });
        
        const data = await response.json();
        console.log('Check code response:', data);
        
        if (data.success) {
            const file = data.data.file;
            console.log('File data:', file);
            
            // Show success message in result div
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h6>File Found Successfully!</h6>
                    <p>File details are now displayed on the right panel.</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            
            // Show the file display card and populate it with file details
            const fileDisplayCard = document.getElementById('file-display-card');
            const adminFilesList = document.getElementById('admin-files-list');
            
            adminFilesList.innerHTML = `
                <div class="file-item">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h6 class="mb-1">${file.originalName}</h6>
                            <small class="text-muted">${formatFileSize(file.fileSize)} • ${file.uploadedBy.username}</small>
                        </div>
                        <div>
                            ${file.isCheckedByAdmin ? '<span class="badge bg-success">Already Checked</span>' : '<span class="badge bg-warning">Pending</span>'}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <p><strong>File Type:</strong> ${file.mimeType}</p>
                        <p><strong>Uploaded by:</strong> ${file.uploadedBy.username}</p>
                        <p><strong>Uploaded on:</strong> ${new Date(file.createdAt).toLocaleString()}</p>
                    </div>
                    
                    <div class="d-flex gap-2 mb-3">
                        <button class="btn btn-primary view-file-btn" data-file-id="${file.id}">
                            <i class="fas fa-eye me-1"></i>View File
                        </button>
                        <button class="btn btn-success download-file-btn" data-file-id="${file.id}">
                            <i class="fas fa-download me-1"></i>Download File
                        </button>
                    </div>
                    
                    <div class="mt-3">
                        <small class="text-muted">
                            <strong>Note:</strong> The upload code will change after 60 seconds from when you entered it.
                        </small>
                        <div id="countdown-timer" class="mt-2"></div>
                    </div>
                </div>
            `;
            
            // Show the file display card
            fileDisplayCard.classList.remove('hidden');
            
            // Start countdown timer if code was just entered
            if (file.codeEnteredAt) {
                startCountdownTimer(file.codeEnteredAt);
            }
            
            showAlert('File found successfully!', 'success');
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    ${data.message}
                </div>
            `;
            resultDiv.classList.remove('hidden');
            
            // Hide the file display card on error
            const fileDisplayCard = document.getElementById('file-display-card');
            fileDisplayCard.classList.add('hidden');
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                Failed to check code. Please try again.
            </div>
        `;
        resultDiv.classList.remove('hidden');
        
        // Hide the file display card on error
        const fileDisplayCard = document.getElementById('file-display-card');
        fileDisplayCard.classList.add('hidden');
    }
}

// Load functions
async function loadUserFiles() {
    try {
        const response = await fetch('/api/files/my-files', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        const filesList = document.getElementById('user-files-list');
        
        if (data.success && data.data.files.length > 0) {
            filesList.innerHTML = data.data.files.map(file => `
                <div class="file-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${file.originalName}</h6>
                            <small class="text-muted">${formatFileSize(file.fileSize)} • ${new Date(file.createdAt).toLocaleDateString()}</small>
                        </div>
                        <div class="text-end">
                            <button class="btn btn-sm btn-outline-primary mb-2" onclick="showUploadCode('${file.uploadCode}')">
                                <i class="fas fa-key me-1"></i>Show Code
                            </button>
                            <div>
                                ${file.isCheckedByAdmin ? '<span class="badge bg-success">Checked by Admin</span>' : '<span class="badge bg-warning">Pending</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            filesList.innerHTML = '<p class="text-muted">No files uploaded yet</p>';
        }
    } catch (error) {
        console.error('Error loading user files:', error);
    }
}

async function loadAdminFiles() {
    try {
        const response = await fetch('/api/files/all', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        console.log('Admin files data:', data);
        const filesList = document.getElementById('admin-files-list');
        
        if (data.success && data.data.files.length > 0) {
            filesList.innerHTML = data.data.files.map(file => `
                <div class="file-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${file.originalName}</h6>
                            <small class="text-muted">${formatFileSize(file.fileSize)} • ${file.uploadedBy.username}</small>
                        </div>
                        <div class="text-end">
                            <div class="d-flex gap-1 mb-2">
                                <button class="btn btn-sm btn-outline-primary view-file-btn" data-file-id="${file._id}" title="View File">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-success download-file-btn" data-file-id="${file._id}" title="Download File">
                                    <i class="fas fa-download"></i>
                                </button>
                            </div>
                            ${file.isCheckedByAdmin ? '<span class="badge bg-success">Checked</span>' : '<span class="badge bg-warning">Pending</span>'}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            filesList.innerHTML = '<p class="text-muted">No files found</p>';
        }
    } catch (error) {
        console.error('Error loading admin files:', error);
    }
}

// File viewing and downloading functions
async function viewFile(fileId) {
    console.log('viewFile called with fileId:', fileId);
    
    // Check if file display card is visible (meaning a code was entered)
    const fileDisplayCard = document.getElementById('file-display-card');
    if (fileDisplayCard && !fileDisplayCard.classList.contains('hidden')) {
        // Code was entered, allow file access
        try {
            const response = await fetch(`/api/files/view/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                // Get the new code from response headers
                const newCode = response.headers.get('X-New-Upload-Code');
                
                // Open file in new tab
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                
                // Show success message with new code
                if (newCode) {
                    showAlert(`File viewed successfully! New code: ${newCode}`, 'success');
                }
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || 'Failed to view file', 'danger');
            }
        } catch (error) {
            showAlert('Failed to view file. Please try again.', 'danger');
        }
    } else {
        // No code entered, show warning
        showAlert('Please enter the upload code first to access files. Use the "Enter File Code" section above.', 'warning');
        
        // Focus on the code input field
        const codeInput = document.getElementById('upload-code-input');
        if (codeInput) {
            codeInput.focus();
        }
    }
}

async function downloadFile(fileId) {
    console.log('downloadFile called with fileId:', fileId);
    
    // Check if file display card is visible (meaning a code was entered)
    const fileDisplayCard = document.getElementById('file-display-card');
    if (fileDisplayCard && !fileDisplayCard.classList.contains('hidden')) {
        // Code was entered, allow file access
        try {
            const response = await fetch(`/api/files/download/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                // Get the new code from response headers
                const newCode = response.headers.get('X-New-Upload-Code');
                
                // Create download link
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'file';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Show success message with new code
                if (newCode) {
                    showAlert(`File downloaded successfully! New code: ${newCode}`, 'success');
                }
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || 'Failed to download file', 'danger');
            }
        } catch (error) {
            showAlert('Failed to download file. Please try again.', 'danger');
        }
    } else {
        // No code entered, show warning
        showAlert('Please enter the upload code first to access files. Use the "Enter File Code" section above.', 'warning');
        
        // Focus on the code input field
        const codeInput = document.getElementById('upload-code-input');
        if (codeInput) {
            codeInput.focus();
        }
    }
}

// Show upload code function
function showUploadCode(uploadCode) {
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-key me-2"></i>Your Upload Code
                    </h5>
                    <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Share this code with the admin manually</strong>
                        <br>
                        <small class="text-muted">The admin will need this code to access your file</small>
                    </div>
                    <div class="text-center mb-4">
                        <div class="code-display">${uploadCode}</div>
                    </div>
                    <div class="text-center">
                        <button class="btn btn-primary btn-lg" onclick="copyToClipboard('${uploadCode}')">
                            <i class="fas fa-copy me-2"></i>Copy Code to Clipboard
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times me-1"></i>Close
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Copy to clipboard function
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Code copied to clipboard!', 'success');
    }).catch(() => {
        showAlert('Failed to copy code', 'danger');
    });
}

// Countdown timer function
function startCountdownTimer(codeEnteredAt) {
    const timerElement = document.getElementById('countdown-timer');
    if (!timerElement) return;
    
    const enteredTime = new Date(codeEnteredAt);
    const targetTime = new Date(enteredTime.getTime() + 60000); // 60 seconds from entry
    
    function updateTimer() {
        const now = new Date();
        const timeLeft = targetTime - now;
        
        if (timeLeft <= 0) {
            timerElement.innerHTML = '<span class="badge bg-warning">Code will change on next access</span>';
            return;
        }
        
        const secondsLeft = Math.ceil(timeLeft / 1000);
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        
        timerElement.innerHTML = `
            <span class="badge bg-info">
                <i class="fas fa-clock me-1"></i>
                Code changes in: ${minutes}:${seconds.toString().padStart(2, '0')}
            </span>
        `;
    }
    
    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    // Clear interval after 60 seconds
    setTimeout(() => {
        clearInterval(interval);
    }, 60000);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showAlert(message, type) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Floating particles effect
function createFloatingParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random positioning
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 20) + 's';
        
        // Random size variation
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        particlesContainer.appendChild(particle);
    }
}
