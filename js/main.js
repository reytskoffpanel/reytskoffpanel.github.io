class App {
    constructor() {
        this.supabaseService = new SupabaseService();
        this.currentUser = null;
        this.init();
    }

    init() {
        this.initModals();
        this.initNavigation();
        this.loadUsers();
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
        // Основная форма создания пользователя
        document.getElementById('createUserBtn').addEventListener('click', () => {
            this.toggleModal('userModal', true);
        });

        // Формы для разных типов пользователей
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
            await this.createUser();
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

    async createUser() {
        const user = {
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            fullName: document.getElementById('fullName').value,
            username: document.getElementById('username').value,
            userType: document.getElementById('userType').value
        };

        if (user.password !== user.confirmPassword) {
            alert('Пароли не совпадают!');
            return;
        }

        try {
            const createdUser = await this.supabaseService.createUserWithRole(
                user.email, 
                user.password, 
                user.fullName, 
                user.userType
            );
            
            alert(`Пользователь ${user.fullName} успешно создан!`);
            this.toggleModal('userModal', false);
            document.getElementById('userForm').reset();
            this.loadUsers();
        } catch (error) {
            console.error('Ошибка создания пользователя:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }

    async loadUsers() {
        try {
            const { data: users, error } = await this.supabaseService.getUsers();
            
            if (error) throw error;
            
            const container = document.getElementById('usersList');
            container.innerHTML = users.map(user => `
                <div class="user-card ${user.user_type}">
                    <div class="user-icon">
                        ${this.getUserIcon(user.user_type)}
                    </div>
                    <h3>${user.full_name}</h3>
                    <p>Тип: ${this.getUserType(user.user_type)}</p>
                    <p>Email: ${user.email}</p>
                    <p>Создан: ${new Date(user.created_at).toLocaleString()}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        }
    }

    getUserType(type) {
        const types = {
            student: 'Ученик',
            teacher: 'Учитель',
            assistant: 'Помощник',
            admin: 'Администратор'
        };
        return types[type] || 'Неизвестно';
    }

    getUserIcon(type) {
        const icons = {
            student: '<i class="fas fa-user-graduate"></i>',
            teacher: '<i class="fas fa-chalkboard-teacher"></i>',
            assistant: '<i class="fas fa-hands-helping"></i>',
            admin: '<i class="fas fa-user-cog"></i>'
        };
        return icons[type] || '<i class="fas fa-user"></i>';
    }

    initNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.setActiveSection(link.dataset.section);
            });
        });
    }

    setActiveSection(section) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        event.target.classList.add('active');
        console.log('Переход в раздел:', section);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});