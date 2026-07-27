// Enhanced Modern Banking App
class CoreBankingApp {
    constructor() {
        // Resolve API base to a full absolute URL; if opened from file:// fallback to localhost
        const origin = (window && window.location && window.location.protocol === 'file:')
            ? 'http://localhost:3000' // adjust your backend host/port if different
            : window.location.origin;
        this.API_BASE = `${origin}/api`;
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupPreloader();
            this.setupNavigation();
            this.setupEventListeners();
            this.loadDashboard();
            this.setupAnimations();
        });
    }

    setupPreloader() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('preloader').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('preloader').style.display = 'none';
                }, 500);
            }, 1000);
        });
    }

    setupNavigation() {
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });
    }

    setupEventListeners() {
        // Forms
        document.getElementById('customerForm').addEventListener('submit', (e) => this.handleAddCustomer(e));
        document.getElementById('depositForm').addEventListener('submit', (e) => this.handleDeposit(e));
        document.getElementById('withdrawForm').addEventListener('submit', (e) => this.handleWithdraw(e));
        document.getElementById('transferForm').addEventListener('submit', (e) => this.handleTransfer(e));
    }

    setupAnimations() {
        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.stat-card, .modern-card').forEach(el => {
            observer.observe(el);
        });
    }

   async showSection(sectionName) {
        const currentActiveSection = document.querySelector('.content-section.active');
        const nextSection = document.getElementById(sectionName);

        // 1. Fade out current section (if one exists)
        if (currentActiveSection && currentActiveSection.id !== sectionName) {
            currentActiveSection.classList.remove('animate__fadeIn', 'animate__animated', 'animate__fadeInUp');
            currentActiveSection.classList.add('animate__animated', 'animate__fadeOut', 'animate__faster'); // added faster for quicker transition

            await new Promise(resolve => {
                // Wait for the fadeOut animation to finish (approx 300ms for 'faster')
                setTimeout(() => {
                    currentActiveSection.classList.remove('active', 'animate__animated', 'animate__fadeOut', 'animate__faster');
                    resolve();
                }, 300); 
            });
        } else if (currentActiveSection && currentActiveSection.id === sectionName) {
            // Already on this section, do nothing
            return;
        }

        // 2. Show and Fade in selected section
        nextSection.classList.add('active', 'animate__animated', 'animate__fadeIn', 'animate__faster');

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionName}"]`).classList.add('active');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Load section data
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'customers':
                await this.loadCustomers();
                break;
            case 'accounts':
                await this.loadAccounts();
                break;
            case 'audit':
                await this.loadAuditLogs();
                break;
            case 'team': 
                // Static content, no data loading needed
                break;
        }

        this.currentSection = sectionName;
    }

    // Loading utilities
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    // API call function
    async apiCall(endpoint, options = {}) {
        try {
            this.showLoading();

            // Build absolute URL
            const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
                ? endpoint
                : `${this.API_BASE.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

            // Prepare options safely
            const fetchOptions = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                // include credentials by default (adjust if not needed)
                credentials: options.credentials || 'same-origin',
                mode: options.mode || 'cors',
                cache: options.cache || 'no-cache'
            };

            // Stringify body if present and not already a string / FormData
            if (options.body !== undefined && options.body !== null) {
                if (typeof options.body === 'string' || options.body instanceof FormData) {
                    fetchOptions.body = options.body;
                    // If FormData, allow browser to set content-type (remove header)
                    if (options.body instanceof FormData) {
                        delete fetchOptions.headers['Content-Type'];
                    }
                } else {
                    fetchOptions.body = JSON.stringify(options.body);
                }
            }

            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                // try to parse json error if any
                let errText = `HTTP error! status: ${response.status}`;
                try {
                    const errBody = await response.json();
                    errText += ` - ${errBody.error || JSON.stringify(errBody)}`;
                } catch (_) {
                    // ignore parse errors
                }
                throw new Error(errText);
            }

            // attempt to parse JSON; return null if no content
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (error) {
            console.error('API call failed:', error);
            this.showNotification('Error: ' + (error.message || 'Network error'), 'danger');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Notification system
    showNotification(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 100px; right: 20px; z-index: 1000; min-width: 300px;';
        alert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getNotificationIcon(type)} me-2"></i>
                <div>${message}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Dashboard functions
    async loadDashboard() {
        try {
            const [customers, accounts, audit] = await Promise.all([
                this.apiCall('/customers'),
                this.apiCall('/accounts'),
                this.apiCall('/audit')
            ]);

            // Update hero stats
            document.getElementById('heroCustomers').textContent = customers.length;
            document.getElementById('heroAccounts').textContent = accounts.length;

            const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.Balance), 0);
            document.getElementById('heroBalance').textContent = this.formatCurrency(totalBalance);

            // Update dashboard stats
            document.getElementById('totalCustomers').textContent = customers.length;
            document.getElementById('totalAccounts').textContent = accounts.length;
            document.getElementById('totalBalance').textContent = this.formatCurrency(totalBalance);

            const today = new Date().toISOString().split('T')[0];
            const todayTransactions = audit.filter(log =>
                log.CreatedAt.includes(today) &&
                ['COMMIT', 'Success'].includes(log.Operation)
            ).length;
            document.getElementById('todayTransactions').textContent = todayTransactions;

            // Load recent activity
            this.loadRecentActivity(audit);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    loadRecentActivity(auditLogs) {
        const activityList = document.getElementById('recentActivity');
        const recentActivities = auditLogs.slice(0, 5);

        activityList.innerHTML = recentActivities.map(log => `
            <div class="activity-item">
                <div class="activity-icon ${this.getActivityType(log.Operation)}">
                    <i class="fas fa-${this.getActivityIcon(log.Operation)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${log.Operation} - ${log.TableAffected}</div>
                    <div class="activity-desc">${log.Details || 'No details available'}</div>
                    <div class="activity-time">${new Date(log.CreatedAt).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }

    getActivityType(operation) {
        const types = {
            'COMMIT': 'success',
            'ROLLBACK': 'warning',
            'INSERT': 'info',
            'UPDATE': 'warning',
            'DELETE': 'danger'
        };
        return types[operation] || 'info';
    }

    getActivityIcon(operation) {
        const icons = {
            'COMMIT': 'check-circle',
            'ROLLBACK': 'exclamation-triangle',
            'INSERT': 'plus-circle',
            'UPDATE': 'edit',
            'DELETE': 'trash'
        };
        return icons[operation] || 'info-circle';
    }

    // Customer functions
    async loadCustomers() {
        try {
            const customers = await this.apiCall('/customers');
            const tableBody = document.getElementById('customersTable');

            tableBody.innerHTML = customers.map(customer => `
                <tr>
                    <td><strong>#${customer.CustID}</strong></td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="customer-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div>
                                <div class="fw-bold">${customer.Name}</div>
                                <small class="text-muted">Customer</small>
                            </div>
                        </div>
                    </td>
                    <td>${customer.CNIC}</td>
                    <td>${customer.Contact}</td>
                    <td>${customer.Gmail}</td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.editCustomer(${customer.CustID})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading customers:', error);
        }
    }

    // MODIFIED: Added accountType handling
   // Enhanced handleAddCustomer with better validation
// Enhanced handleAddCustomer with balance handling
async handleAddCustomer(e) {
    e.preventDefault();
    
    console.log('Starting customer addition process...');

    try {
        // Get form elements with null checks
        const nameInput = document.getElementById('customerName');
        const cnicInput = document.getElementById('customerCNIC');
        const contactInput = document.getElementById('customerContact');
        const emailInput = document.getElementById('customerEmail') || document.getElementById('customerGmail');
        const accountTypeInput = document.getElementById('customerAccountType');
        const balanceInput = document.getElementById('customerBalance'); // NEW: Get balance input

        // Validate required fields exist
        if (!nameInput || !cnicInput || !contactInput) {
            this.showNotification('Required form fields are missing', 'danger');
            return;
        }

        const formData = {
            name: nameInput.value.trim(),
            cnic: cnicInput.value.trim(),
            contact: contactInput.value.trim(),
            gmail: emailInput ? emailInput.value.trim() : '',
            accountType: accountTypeInput ? accountTypeInput.value : 'SAV',
            initialBalance: balanceInput ? parseFloat(balanceInput.value) || 0 : 0 // NEW: Get balance value
        };

        // Enhanced client-side validation
        if (!formData.name) {
            this.showNotification('Please enter customer name', 'danger');
            nameInput.focus();
            return;
        }

        if (!formData.cnic) {
            this.showNotification('Please enter CNIC number', 'danger');
            cnicInput.focus();
            return;
        }

        // CNIC format validation
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicRegex.test(formData.cnic)) {
            this.showNotification('CNIC must be in format: 12345-1234567-1', 'danger');
            cnicInput.focus();
            return;
        }

        if (!formData.contact) {
            this.showNotification('Please enter contact number', 'danger');
            contactInput.focus();
            return;
        }

        // Contact format validation
        const contactRegex = /^03\d{2}-\d{7}$/;
        if (!contactRegex.test(formData.contact)) {
            this.showNotification('Contact must be in format: 03XX-XXXXXXX', 'danger');
            contactInput.focus();
            return;
        }

        if (formData.gmail) {
            // Email validation
            const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            if (!emailRegex.test(formData.gmail)) {
                this.showNotification('Please enter a valid Gmail address', 'danger');
                emailInput.focus();
                return;
            }
        }

        if (!formData.accountType) {
            this.showNotification('Please select an account type', 'danger');
            accountTypeInput.focus();
            return;
        }

        // NEW: Validate balance
        if (formData.initialBalance < 0) {
            this.showNotification('Initial balance cannot be negative', 'danger');
            balanceInput.focus();
            return;
        }

        console.log('Sending customer data:', formData);

        // API call with balance included
        const result = await this.apiCall('/customers', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        console.log('Customer added successfully:', result);

        this.showNotification(
            `Customer and account created successfully! Initial balance: ₹${formData.initialBalance.toFixed(2)}`, 
            'success'
        );
        document.getElementById('customerForm').reset();
        
        // Refresh relevant sections
        await Promise.all([
            this.loadCustomers(),
            this.loadDashboard(),
            this.loadAccounts()
        ]);

    } catch (error) {
        console.error('Error adding customer:', error);
        this.showNotification(`Failed to add customer: ${error.message}`, 'danger');
    }
}
    // MODIFIED: Read-only display only
    async loadAccounts() {
        try {
            const accounts = await this.apiCall('/accounts');
            const tableBody = document.getElementById('accountsTable');

            tableBody.innerHTML = accounts.map(account => `
                <tr>
                    <td><strong>${account.AccountNo}</strong></td>
                    <td>${account.CustomerName || account.CustID}</td>
                    <td>
                        <span class="badge ${account.Type === 'Savings' ? 'badge-success' : 'badge-info'}">
                            ${account.Type}
                        </span>
                    </td>
                    <td class="fw-bold">${this.formatCurrency(account.Balance)}</td>
                    <td>
                        <span class="badge ${account.Status === 'Active' ? 'badge-success' : 'badge-secondary'}">
                            ${account.Status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" title="View Account Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            // Update showing counts
            document.getElementById('accountsShowing').textContent = accounts.length;
            document.getElementById('accountsTotal').textContent = accounts.length;

        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    }

    // Transaction functions
    async handleDeposit(e) {
        e.preventDefault();
        await this.processTransaction('deposit', e.target);
    }

    async handleWithdraw(e) {
        e.preventDefault();
        await this.processTransaction('withdraw', e.target);
    }

    async handleTransfer(e) {
        e.preventDefault();
        await this.processTransaction('transfer', e.target);
    }

    async processTransaction(type, form) {
        const formData = new FormData(form);
        const data = {
            accountNo: formData.get(type === 'transfer' ? 'fromAccount' : 'account'),
            amount: parseFloat(formData.get('amount')),
            user: formData.get('user')
        };

        if (type === 'transfer') {
            data.toAccount = formData.get('toAccount');
        }

        try {
            const result = await this.apiCall(`/transactions/${type}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (result.success) {
                this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} completed successfully!`, 'success');
                this.displayTransactionResult(type, data, result);
                form.reset();
                this.loadDashboard();
            } else {
                throw new Error(result.error || 'Transaction failed');
            }

        } catch (error) {
            console.error(`Error processing ${type}:`, error);
            this.displayTransactionError(error.message);
        }
    }

    displayTransactionResult(type, data, result) {
        let resultHtml = `
            <div class="transaction-success">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h5>Transaction Successful</h5>
                <div class="transaction-details">
                    <div class="detail-item">
                        <span>Type:</span>
                        <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                    </div>
                    <div class="detail-item">
                        <span>Amount:</span>
                        <strong>${this.formatCurrency(data.amount)}</strong>
                    </div>
        `;

        if (type === 'deposit' && result.receiver) {
            resultHtml += `
                <div class="detail-item">
                    <span>Account:</span>
                    <strong>#${result.receiver.accountNo} (${result.receiver.name})</strong>
                </div>
                <div class="detail-item">
                    <span>New Balance:</span>
                    <strong>${this.formatCurrency(result.receiver.newBalance)}</strong>
                </div>
            `;
        } else if (type === 'withdraw' && result.sender) {
            resultHtml += `
                <div class="detail-item">
                    <span>Account:</span>
                    <strong>#${result.sender.accountNo} (${result.sender.name})</strong>
                </div>
                <div class="detail-item">
                    <span>New Balance:</span>
                    <strong>${this.formatCurrency(result.sender.newBalance)}</strong>
                </div>
            `;
        } else if (type === 'transfer' && result.sender && result.receiver) {
            resultHtml += `
                <div class="detail-item">
                    <span>From:</span>
                    <strong>#${result.sender.accountNo} (${result.sender.name})</strong>
                </div>
                <div class="detail-item">
                    <span>To:</span>
                    <strong>#${result.receiver.accountNo} (${result.receiver.name})</strong>
                </div>
                <div class="detail-item">
                    <span>Sender Balance:</span>
                    <strong>${this.formatCurrency(result.sender.newBalance)}</strong>
                </div>
                <div class="detail-item">
                    <span>Receiver Balance:</span>
                    <strong>${this.formatCurrency(result.receiver.newBalance)}</strong>
                </div>
            `;
        }

        resultHtml += `</div></div>`;
        document.getElementById('transactionResult').innerHTML = resultHtml;
    }

    displayTransactionError(message) {
        const errorHtml = `
            <div class="transaction-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h5>Transaction Failed</h5>
                <div class="error-message">
                    <p>${message}</p>
                </div>
            </div>
        `;
        document.getElementById('transactionResult').innerHTML = errorHtml;
    }

    // MODIFIED: Fixed statistics calculation
    async loadAuditLogs() {
        try {
            const auditLogs = await this.apiCall('/audit');

            // Calculate Stats - FIXED: Proper counting logic
            const totalLogs = auditLogs.length;
            
            // Count successful operations (COMMIT or Status = 'Success')
            const successfulOps = auditLogs.filter(log => 
                log.Operation === 'COMMIT' || log.Status === 'Success'
            ).length;
            
            // Count failed operations (ROLLBACK or Status = 'Failed')
            const failedOps = auditLogs.filter(log => 
                log.Operation === 'ROLLBACK' || log.Status === 'Failed'
            ).length;

            // Count today's operations
            const today = new Date().toISOString().split('T')[0];
            const todayOps = auditLogs.filter(log => 
                log.CreatedAt && log.CreatedAt.startsWith(today)
            ).length;

            // Update Stat Cards - FIXED: Using correct element IDs
            document.getElementById('totalAuditLogs').textContent = totalLogs;
            document.getElementById('successfulOperations').textContent = successfulOps;
            document.getElementById('failedOperations').textContent = failedOps;
            document.getElementById('todayOperations').textContent = todayOps;

            // Populate audit table
            const tableBody = document.getElementById('auditTable');
            tableBody.innerHTML = auditLogs.map(log => `
                <tr>
                    <td><strong>#${log.LogID}</strong></td>
                    <td>
                        <span class="badge 
                        ${log.Operation === 'COMMIT' ? 'badge-success' :
                            log.Operation === 'ROLLBACK' ? 'badge-warning' :
                            log.Operation === 'INSERT' ? 'badge-info' :  // <-- NEW: Use 'badge-info' for INSERT
                            'badge-secondary'
                }">
                            ${log.Operation}
                        </span>
                    </td>
                    <td>${log.TableAffected}</td>
                    <td>${log.RecordID || 'N/A'}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="user-avatar-sm">
                                <i class="fas fa-user"></i>
                            </div>
                            <span>${log.UserName}</span>
                        </div>
                    </td>
                    <td>${log.Details || 'No details'}</td>
                    <td>${new Date(log.CreatedAt).toLocaleString()}</td>
                </tr>
            `).join('');

            // Update showing counts
            document.getElementById('auditShowing').textContent = auditLogs.length;
            document.getElementById('auditTotal').textContent = auditLogs.length;

        } catch (error) {
            console.error('Error loading audit logs:', error);
        }
    }

    // Utility functions
    formatCurrency(amount) {
        return 'pkr ' + parseFloat(amount).toLocaleString('en-IN');
    }

    editCustomer(customerId) {
        this.showNotification('Edit feature coming soon!', 'info');
    }

    // Additional methods for audit filters
    applyAuditFilters() {
        this.showNotification('Filter functionality coming soon!', 'info');
    }

    clearAuditFilters() {
        document.getElementById('auditOperationFilter').value = '';
        document.getElementById('auditTableFilter').value = '';
        document.getElementById('auditDateFrom').value = '';
        document.getElementById('auditDateTo').value = '';
        this.loadAuditLogs();
    }

    exportAuditLogs() {
        this.showNotification('Export functionality coming soon!', 'info');
    }

    refreshAuditLogs() {
        this.loadAuditLogs();
        this.showNotification('Audit logs refreshed!', 'success');
    }
}

// Initialize the application
const app = new CoreBankingApp();

// Global functions for HTML onclick
window.showSection = (section) => app.showSection(section);
window.editCustomer = (id) => app.editCustomer(id);