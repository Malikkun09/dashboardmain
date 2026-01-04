// Domain persistence functions
        function saveDomains() {
            localStorage.setItem('domains', JSON.stringify(domains));
        }

        function loadDomains() {
            const saved = localStorage.getItem('domains');
            if (saved) {
                return JSON.parse(saved);
            }
            // Default domain
            return [
                { id: 1, name: 'mlikfjr.my.id', type: 'domain', category: 'Main Domain', status: 'checking', responseTime: 0, lastChecked: null }
            ];
        }

        // Domain data
        let domains = loadDomains();
        let currentFilter = 'all';

        let autoRefreshInterval;

        // Initialize dashboard
        function initDashboard() {
            renderDomains();
            updateStats();
            updateFilterCounts();
            checkAllDomains();
            setupAutoRefresh();
        }

        // Update filter counts
        function updateFilterCounts() {
            const allCount = domains.length;
            const onlineCount = domains.filter(d => d.status === 'online').length;
            const issueCount = domains.filter(d => d.status === 'offline').length;
            const timeoutCount = domains.filter(d => d.status === 'timeout').length;

            document.getElementById('countAll').textContent = allCount;
            document.getElementById('countOnline').textContent = onlineCount;
            document.getElementById('countIssue').textContent = issueCount;
            document.getElementById('countTimeout').textContent = timeoutCount;
        }

        // Filter domains
        function filterDomains(filter) {
            currentFilter = filter;

            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('filter-btn-active');
                if (btn.dataset.filter === filter) {
                    btn.classList.add('filter-btn-active');
                }
            });

            renderDomains();
        }

        // Render domains
        function renderDomains() {
            const domainList = document.getElementById('domainList');
            const emptyState = document.getElementById('emptyState');
            const filterTabs = document.getElementById('filterTabs');

            if (domains.length === 0) {
                domainList.classList.add('hidden');
                filterTabs.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            domainList.classList.remove('hidden');
            filterTabs.classList.remove('hidden');
            emptyState.classList.add('hidden');

            // Filter domains based on current filter
            let filteredDomains = domains;
            if (currentFilter === 'online') {
                filteredDomains = domains.filter(d => d.status === 'online');
            } else if (currentFilter === 'issue') {
                filteredDomains = domains.filter(d => d.status === 'offline');
            } else if (currentFilter === 'timeout') {
                filteredDomains = domains.filter(d => d.status === 'timeout');
            }

            // Show empty message if no domains in filter
            if (filteredDomains.length === 0) {
                domainList.innerHTML = `
                    <div class="glass-effect rounded-xl p-8 text-center">
                        <i class="fas fa-search text-4xl text-gray-600 mb-4"></i>
                        <p class="text-gray-400">Tidak ada domain dengan status ini.</p>
                    </div>
                `;
                return;
            }

            domainList.innerHTML = '';

            filteredDomains.forEach((domain, index) => {
                const card = createDomainCard(domain);
                card.style.animationDelay = `${index * 0.1}s`;
                domainList.appendChild(card);
            });
        }

        // Create domain card
        function createDomainCard(domain) {
            const card = document.createElement('div');
            card.className = `glass-effect rounded-xl p-4 sm:p-6 status-card status-${domain.status} fade-in`;

            const statusIconClass = getStatusIconClass(domain.status);
            const statusBadgeClass = getStatusBadgeClass(domain.status);
            const statusText = getStatusText(domain.status);

            const responseTimeSpan = domain.responseTime > 0
                ? `<span class="whitespace-nowrap"><i class="fas fa-tachometer-alt mr-1 text-cyan-400"></i>${domain.responseTime}ms</span>`
                : '';
            const lastCheckedSpan = domain.lastChecked
                ? `<span class="whitespace-nowrap"><i class="fas fa-clock mr-1 text-yellow-400"></i>${new Date(domain.lastChecked).toLocaleTimeString('id-ID')}</span>`
                : '';

            card.innerHTML = `
                <div class="flex flex-col sm:flex-row items-start gap-3">
                    <!-- Icon -->
                    <div class="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${statusBadgeClass}">
                        <i class="fas ${statusIconClass} text-lg sm:text-2xl"></i>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0 w-full">
                        <!-- Top row: Name + Badges -->
                        <div class="flex flex-wrap items-center gap-2 mb-2">
                            <h3 class="text-base sm:text-xl font-semibold text-white truncate max-w-[150px] sm:max-w-none">${domain.name}</h3>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass} flex-shrink-0">
                                ${statusText}
                            </span>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">
                                ${domain.type}
                            </span>
                        </div>

                        <!-- Bottom row: Category + Time + Actions -->
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <!-- Category info -->
                            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-400">
                                <span class="whitespace-nowrap"><i class="fas fa-tag mr-1 text-purple-400"></i>${domain.category}</span>
                                ${responseTimeSpan}
                                ${lastCheckedSpan}
                            </div>

                            <!-- Action buttons -->
                            <div class="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                <button onclick="showLogModal(${domain.id})" class="icon-btn icon-btn-log" title="Check Log">
                                    <i class="fas fa-history text-xs sm:text-base"></i>
                                </button>
                                <button onclick="checkDomain(${domain.id})" class="icon-btn icon-btn-sync" title="Check Status">
                                    <i class="fas fa-sync-alt text-xs sm:text-base"></i>
                                </button>
                                <button onclick="deleteDomain(${domain.id})" class="icon-btn icon-btn-delete" title="Delete">
                                    <i class="fas fa-trash text-xs sm:text-base"></i>
                                </button>
                                <a href="https://${domain.name}" target="_blank" class="icon-btn icon-btn-open" title="Open">
                                    <i class="fas fa-external-link-alt text-xs sm:text-base"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            return card;
        }

        // Get status icon class
        function getStatusIconClass(status) {
            switch(status) {
                case 'online': return 'fa-check-circle';
                case 'offline': return 'fa-times-circle';
                case 'timeout': return 'fa-clock';
                default: return 'fa-spinner fa-spin';
            }
        }

        // Get status badge class
        function getStatusBadgeClass(status) {
            switch(status) {
                case 'online': return 'bg-green-500/20 text-green-400 border border-green-500/30';
                case 'offline': return 'bg-red-500/20 text-red-400 border border-red-500/30';
                case 'timeout': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
                default: return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
            }
        }

        // Get status text
        function getStatusText(status) {
            switch(status) {
                case 'online': return 'Online';
                case 'offline': return 'Offline';
                case 'timeout': return 'Timeout';
                default: return 'Checking...';
            }
        }

        // Log functions
        function getDomainLogs(domainId) {
            const allLogs = JSON.parse(localStorage.getItem('domainLogs') || '{}');
            return allLogs[domainId] || [];
        }

        function addLogEntry(domainId, entry) {
            const allLogs = JSON.parse(localStorage.getItem('domainLogs') || '{}');
            if (!allLogs[domainId]) {
                allLogs[domainId] = [];
            }
            allLogs[domainId].unshift(entry);
            allLogs[domainId] = allLogs[domainId].slice(0, 50);
            localStorage.setItem('domainLogs', JSON.stringify(allLogs));
        }

        function clearDomainLogs(domainId) {
            if (!domainId) return;
            const allLogs = JSON.parse(localStorage.getItem('domainLogs') || '{}');
            allLogs[domainId] = [];
            localStorage.setItem('domainLogs', JSON.stringify(allLogs));
            showLogModal(domainId);
        }

        let currentLogDomainId = null;
        let domainToDelete = null;

        function showLogModal(domainId) {
            currentLogDomainId = domainId;
            const domain = domains.find(d => d.id === domainId);
            if (!domain) return;

            document.getElementById('logDomainName').textContent = domain.name;
            renderLogEntries(domainId);
            document.getElementById('logModal').classList.remove('hidden');
        }

        function hideLogModal() {
            document.getElementById('logModal').classList.add('hidden');
            currentLogDomainId = null;
        }

        function renderLogEntries(domainId) {
            const logs = getDomainLogs(domainId);
            const logContent = document.getElementById('logContent');

            if (logs.length === 0) {
                logContent.innerHTML = `
                    <div class="text-center py-8 text-gray-400">
                        <i class="fas fa-history text-4xl mb-4 text-gray-600"></i>
                        <p>Belum ada riwayat check untuk domain ini.</p>
                        <p class="text-sm mt-2">Klik tombol check untuk memulai monitoring.</p>
                    </div>
                `;
                return;
            }

            logContent.innerHTML = logs.map((log) => {
                const statusClass = log.status === 'online' ? 'text-green-400' :
                                   log.status === 'offline' ? 'text-red-400' :
                                   log.status === 'timeout' ? 'text-yellow-400' : 'text-blue-400';
                const statusIcon = log.status === 'online' ? 'fa-check-circle' :
                                  log.status === 'offline' ? 'fa-times-circle' :
                                  log.status === 'timeout' ? 'fa-clock' : 'fa-spinner fa-spin';

                return `
                    <div class="log-entry p-4 mb-2 flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center ${statusClass.replace('text-', 'bg-').replace('400', '500/20')}">
                                <i class="fas ${statusIcon} ${statusClass}"></i>
                            </div>
                            <div>
                                <div class="font-medium text-white capitalize">${log.status}</div>
                                <div class="text-sm text-gray-400">${new Date(log.timestamp).toLocaleString('id-ID')}</div>
                                ${log.error ? `<div class="text-xs text-red-400 mt-1">Error: ${log.error}</div>` : ''}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-white">${log.responseTime}ms</div>
                            <div class="text-xs text-gray-500">Response Time</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Check single domain
        async function checkDomain(domainId) {
            const domain = domains.find(d => d.id === domainId);
            if (!domain) return;

            domain.status = 'checking';
            renderDomains();

            const startTime = Date.now();
            let result = { status: 'checking', responseTime: 0, error: null };

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                await fetch(`https://${domain.name}`, {
                    method: 'GET',
                    mode: 'no-cors',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                result.status = 'online';
                result.responseTime = Date.now() - startTime;
            } catch (error) {
                result.status = error.name === 'AbortError' ? 'timeout' : 'offline';
                result.responseTime = Date.now() - startTime;
                result.error = error.message;
            }

            domain.status = result.status;
            domain.responseTime = result.responseTime;
            domain.lastChecked = new Date().toISOString();

            addLogEntry(domain.id, {
                timestamp: new Date().toISOString(),
                status: result.status,
                responseTime: result.responseTime,
                error: result.error
            });

            saveDomains();
            renderDomains();
            updateStats();
        }

        // Check all domains
        async function checkAllDomains() {
            if (domains.length === 0) return;

            const checkingIndicator = document.getElementById('checkingIndicator');
            checkingIndicator.classList.remove('hidden');

            const promises = domains.map(domain => checkDomain(domain.id));
            await Promise.all(promises);

            checkingIndicator.classList.add('hidden');
            document.getElementById('lastCheck').textContent = new Date().toLocaleTimeString('id-ID');
        }

        // Update statistics
        function updateStats() {
            const total = domains.length;
            const online = domains.filter(d => d.status === 'online').length;
            const issues = domains.filter(d => d.status === 'offline' || d.status === 'timeout').length;
            const uptime = total > 0 ? Math.round((online / total) * 100) : 0;

            document.getElementById('totalDomains').textContent = total;
            document.getElementById('onlineDomains').textContent = online;
            document.getElementById('issueDomains').textContent = issues;
            document.getElementById('uptimePercent').textContent = uptime + '%';
            document.getElementById('totalCount').textContent = total;
            document.getElementById('onlineCount').textContent = online;

            // Update filter counts
            updateFilterCounts();
        }

        // Setup auto refresh
        function setupAutoRefresh() {
            const autoRefreshCheckbox = document.getElementById('autoRefresh');
            if (!autoRefreshCheckbox) return;

            function startAutoRefresh() {
                if (autoRefreshInterval) clearInterval(autoRefreshInterval);
                autoRefreshInterval = setInterval(checkAllDomains, 60000);
            }

            function stopAutoRefresh() {
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                }
            }

            autoRefreshCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    startAutoRefresh();
                } else {
                    stopAutoRefresh();
                }
            });

            if (autoRefreshCheckbox.checked) {
                startAutoRefresh();
            }
        }

        // Show add modal
        function showAddModal() {
            document.getElementById('addModal').classList.remove('hidden');
        }

        // Hide add modal
        function hideAddModal() {
            document.getElementById('addModal').classList.add('hidden');
            document.getElementById('addDomainForm').reset();
        }

        // Add new domain
        document.getElementById('addDomainForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('domainName').value.trim();
            const type = document.getElementById('domainType').value;
            const category = document.getElementById('domainCategory').value.trim() || 'Uncategorized';

            if (name) {
                const newDomain = {
                    id: Date.now(),
                    name: name.toLowerCase(),
                    type: type,
                    category: category,
                    status: 'checking',
                    responseTime: 0,
                    lastChecked: null
                };

                domains.push(newDomain);
                saveDomains();
                renderDomains();
                updateStats();
                hideAddModal();

                setTimeout(() => checkDomain(newDomain.id), 500);
            }
        });

        // Delete domain - show confirmation modal
        function deleteDomain(domainId) {
            const domain = domains.find(d => d.id === domainId);
            if (!domain) return;

            domainToDelete = domainId;
            document.getElementById('deleteDomainName').textContent = domain.name;
            document.getElementById('deleteModal').classList.remove('hidden');
        }

        // Hide delete modal
        function hideDeleteModal() {
            document.getElementById('deleteModal').classList.add('hidden');
            domainToDelete = null;
        }

        // Confirm delete domain
        function confirmDeleteDomain() {
            if (!domainToDelete) return;

            domains = domains.filter(d => d.id !== domainToDelete);

            const allLogs = JSON.parse(localStorage.getItem('domainLogs') || '{}');
            delete allLogs[domainToDelete];
            localStorage.setItem('domainLogs', JSON.stringify(allLogs));

            saveDomains();
            renderDomains();
            updateStats();
            hideDeleteModal();
        }

        // Toast notification function
        function showToast(message) {
            let toast = document.getElementById('toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast';
                toast.className = 'notification fixed bottom-4 right-4 z-50 px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-y-20 opacity-0';
                toast.innerHTML = `
                    <svg style="width:20px; height:20px; fill:white;" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <span id="toast-message" class="text-white"></span>
                `;
                document.body.appendChild(toast);
            }

            const msgSpan = document.getElementById('toast-message');
            msgSpan.textContent = message;

            toast.classList.remove('translate-y-20', 'opacity-0');

            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 3000);
        }
