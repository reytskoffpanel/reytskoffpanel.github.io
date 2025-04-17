class App {
    constructor() {
        this.USER_KEY = 'eldev_users';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.initAuth();
        this.initModals();
        this.initNavigation();
        this.loadUsers();
    }

    initAuth() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('togglePassword').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if(username === 'eldevcreator' && password === 'artem09122') {
            document.getElementById('loginContainer').classList.add('hidden');
            document.getElementById('mainContainer').classList.remove('hidden');
        } else {
            this.showError('Неверные учетные данные');
        }
    }

    togglePasswordVisibility() {
        const input = document.getElementById('password');
        const icon = document.getElementById('togglePassword');
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('fa-eye-slash');
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 3000);
    }

    initModals() {
        document.getElementById('createUserBtn').addEventListener('click', () => {
            this.toggleModal(true);
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            this.toggleModal(false);
        });

        document.getElementById('userForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createUser();
        });
    }

    toggleModal(show) {
        document.getElementById('userModal').classList.toggle('hidden', !show);
    }

    createUser() {
        const user = {
            type: document.getElementById('userType').value,
            fullName: document.getElementById('fullName').value,
            login: document.getElementById('userLogin').value,
            password: document.getElementById('userPassword').value,
            date: new Date().toLocaleString()
        };

        this.saveUser(user);
        this.toggleModal(false);
        this.loadUsers();
    }

    saveUser(user) {
        const users = JSON.parse(localStorage.getItem(this.USER_KEY)) || [];
        users.push(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(users));
    }

    loadUsers() {
        const users = JSON.parse(localStorage.getItem(this.USER_KEY)) || [];
        const container = document.getElementById('usersList');
        container.innerHTML = users.map(user => `
            <div class="user-card">
                <h3>${user.fullName}</h3>
                <p>Тип: ${this.getUserType(user.type)}</p>
                <p>Логин: ${user.login}</p>
                <p>Создан: ${user.date}</p>
            </div>
        `).join('');
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
    }
}

new App();