class App {
    constructor() {
        this.supabaseService = new SupabaseService();
        this.currentUser = null;
        this.init();
    }

    init() {
        this.initModals();
        this.initNavigation();
        this.loadWorkers();
        this.loadOrders();
        this.initEquipmentForm();
        this.initThemeToggle();
    }

    initThemeToggle() {
        const toggleBtn = document.createElement('div');
        toggleBtn.className = 'theme-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        document.body.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const icon = toggleBtn.querySelector('i');
            if (document.body.classList.contains('light-theme')) {
                icon.classList.replace('fa-moon', 'fa-sun');
            } else {
                icon.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }

    initModals() {
        document.getElementById('createWorkerBtn').addEventListener('click', () => {
            this.toggleModal('userModal', true);
        });

        document.querySelectorAll('.open-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const userType = btn.dataset.type;
                document.getElementById('userType').value = userType;
                this.toggleModal('userModal', true);
            });
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleModal('userModal', false);
            });
        });

        document.getElementById('userForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createWorker();
        });
    }

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        modal.classList.toggle('hidden', !show);
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    }

    async createWorker() {
        const worker = {
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            fullName: document.getElementById('fullName').value,
            userType: document.getElementById('userType').value
        };

        if (worker.password !== worker.confirmPassword) {
            alert('Пароли не совпадают!');
            return;
        }

        try {
            const createdWorker = await this.supabaseService.createUserWithRole(
                worker.email, 
                worker.password, 
                worker.fullName, 
                worker.userType
            );
            
            alert(`Работник ${worker.fullName} успешно создан!`);
            this.toggleModal('userModal', false);
            document.getElementById('userForm').reset();
            this.loadWorkers();
        } catch (error) {
            console.error('Ошибка создания работника:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }

    async loadWorkers() {
        try {
            const { data: workers, error } = await this.supabaseService.getWorkers();
            
            if (error) throw error;
            
            const container = document.getElementById('workersList');
            container.innerHTML = workers.map(worker => `
                <div class="worker-card ${worker.user_type}">
                    <div class="worker-info">
                        <div class="worker-avatar">
                            ${this.getWorkerIcon(worker.user_type)}
                        </div>
                        <div class="worker-details">
                            <h3>${worker.full_name}</h3>
                            <p>${this.getWorkerType(worker.user_type)}</p>
                            <p>Email: ${worker.email}</p>
                        </div>
                    </div>
                    <div class="worker-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.editWorker('${worker.id}')">
                            <i class="fas fa-edit"></i>
                            Редактировать
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteWorker('${worker.id}')">
                            <i class="fas fa-trash"></i>
                            Удалить
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки работников:', error);
        }
    }

    getWorkerType(type) {
        const types = {
            moderator: 'Модератор',
            delivery: 'Доставщик',
            seller: 'Продавец'
        };
        return types[type] || 'Неизвестно';
    }

    getWorkerIcon(type) {
        const icons = {
            moderator: '<i class="fas fa-user-shield"></i>',
            delivery: '<i class="fas fa-truck"></i>',
            seller: '<i class="fas fa-store"></i>'
        };
        return icons[type] || '<i class="fas fa-user"></i>';
    }

    initNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active class from all links
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                link.classList.add('active');
                // Show corresponding section
                this.showSection(link.dataset.section);
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        // Show selected section
        const selectedSection = document.getElementById(`${sectionId}Section`);
        if (selectedSection) {
            selectedSection.classList.remove('hidden');
            // Load section data if needed
            if (sectionId === 'workers') {
                this.loadWorkers();
            } else if (sectionId === 'orders') {
                this.loadOrders();
            }
        }
    }

    async loadOrders() {
        try {
            const { data: orders, error } = await this.supabaseService.getOrders();
            
            if (error) throw error;
            
            const container = document.querySelector('.orders-list');
            container.innerHTML = orders.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <h3>Заказ #${order.id}</h3>
                        <span class="order-time">${new Date(order.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div class="order-details">
                        <p><strong>Тип заказа:</strong> <span class="order-type">${order.type}</span></p>
                        <p><strong>Цена:</strong> <span class="order-price">${order.price} ₽</span></p>
                        <p><strong>Адрес:</strong> <span class="order-address">${order.address}</span></p>
                        <p><strong>Телефон:</strong> <span class="order-phone">${order.phone}</span></p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
        }
    }

    initEquipmentForm() {
        const form = document.getElementById('equipmentForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addEquipment();
        });
    }

    async addEquipment() {
        const equipment = {
            name: document.getElementById('equipmentName').value,
            model: document.getElementById('equipmentModel').value,
            description: document.getElementById('equipmentDescription').value
        };

        try {
            const { data, error } = await this.supabaseService.addEquipment(equipment);
            
            if (error) throw error;
            
            alert('Техника успешно добавлена!');
            document.getElementById('equipmentForm').reset();
        } catch (error) {
            console.error('Ошибка добавления техники:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});