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
        this.attachEventListeners();
        this.setupPhoneInputs();
    }

    initModals() {
        // Открытие модальных окон
        document.addEventListener('click', (e) => {
            const openButton = e.target.closest('.open-worker-modal');
            if (openButton) {
                const workerType = openButton.dataset.type;
                const modalId = `${workerType}Modal`;
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        modal.classList.add('active');
                    }, 10);
                }
            }
        });

        // Закрытие модальных окон
        document.addEventListener('click', (e) => {
            if (e.target.matches('.close-modal') || e.target.matches('.modal')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                    }, 300);
                    const form = modal.querySelector('form');
                    if (form) form.reset();
                }
            }
        });
    }

    setupPhoneInputs() {
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        if (!phoneInputs.length) return;
        
        phoneInputs.forEach(input => {
            // Удаляем старые обработчики
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            let previousValue = '';
            
            // При фокусе
            newInput.addEventListener('focus', function() {
                if (!this.value) {
                    this.value = '+7 (';
                    previousValue = this.value;
                }
            });

            // При вводе
            newInput.addEventListener('input', function(e) {
                let cursorPosition = this.selectionStart;
                let value = this.value.replace(/\D/g, '');
                let formattedValue = '';
                
                if (value.length >= 1) {
                    if (value[0] !== '7') {
                        value = '7' + value;
                    }
                    formattedValue = '+7';
                    if (value.length > 1) {
                        formattedValue += ' (' + value.substring(1, 4);
                    }
                    if (value.length >= 4) {
                        formattedValue += ') ' + value.substring(4, 7);
                    }
                    if (value.length >= 7) {
                        formattedValue += '-' + value.substring(7, 9);
                    }
                    if (value.length >= 9) {
                        formattedValue += '-' + value.substring(9, 11);
                    }
                }
                
                if (formattedValue) {
                    this.value = formattedValue;
                    
                    // Восстанавливаем позицию курсора
                    if (cursorPosition < previousValue.length) {
                        this.setSelectionRange(cursorPosition, cursorPosition);
                    }
                }
                
                previousValue = this.value;
            });

            // При вставке
            newInput.addEventListener('paste', function(e) {
                e.preventDefault();
                let pastedText = (e.clipboardData || window.clipboardData).getData('text');
                let value = pastedText.replace(/\D/g, '');
                
                if (value) {
                    if (value[0] !== '7') {
                        value = '7' + value;
                    }
                    let formattedValue = '+7';
                    if (value.length > 1) {
                        formattedValue += ' (' + value.substring(1, 4);
                    }
                    if (value.length >= 4) {
                        formattedValue += ') ' + value.substring(4, 7);
                    }
                    if (value.length >= 7) {
                        formattedValue += '-' + value.substring(7, 9);
                    }
                    if (value.length >= 9) {
                        formattedValue += '-' + value.substring(9, 11);
                    }
                    
                    this.value = formattedValue;
                }
            });

            // При нажатии клавиш
            newInput.addEventListener('keydown', function(e) {
                // Разрешаем: backspace, delete, tab и escape
                if (e.keyCode == 46 || e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 27 ||
                    // Разрешаем: Ctrl+A
                    (e.keyCode == 65 && e.ctrlKey === true) ||
                    // Разрешаем: home, end, влево, вправо
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    return;
                }
                // Запрещаем все, кроме цифр на основной клавиатуре и цифр на цифровой клавиатуре
                if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });
        });
    }

    // Функция для получения чистого номера телефона
    getCleanPhoneNumber(formattedNumber) {
        return formattedNumber.replace(/\D/g, '');
    }

    attachEventListeners() {
        // Обработчики для карточек создания пользователей
        document.querySelectorAll('.open-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userType = e.currentTarget.dataset.type;
                document.getElementById('userType').value = userType;
                this.toggleModal('userModal', true);
            });
        });

        // Обработчик для кнопки быстрого создания
        const createUserBtn = document.getElementById('createUserBtn');
        if (createUserBtn) {
            createUserBtn.addEventListener('click', () => {
                document.getElementById('userType').value = 'student'; // По умолчанию
                this.toggleModal('userModal', true);
            });
        }

        // Обработчики для модального окна
        const closeModalBtns = document.querySelectorAll('.close-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleModal('userModal', false);
            });
        });

        // Обработчик формы создания пользователя
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createUser();
            });
        }

        // Обработчики навигации
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.setActiveSection(e.currentTarget.dataset.section);
            });
        });

        // Обработчики для кнопок создания работников
        document.querySelectorAll('.open-worker-modal').forEach(button => {
            button.addEventListener('click', (e) => {
                const workerType = e.currentTarget.dataset.type;
                const modalId = `${workerType}Modal`;
                document.getElementById(modalId).classList.remove('hidden');
            });
        });

        // Обработчики для закрытия модальных окон
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.classList.add('hidden');
                const form = modal.querySelector('form');
                if (form) form.reset();
            });
        });

        // Обработчики для показа/скрытия пароля
        document.querySelectorAll('.toggle-password').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const passwordInput = e.target.closest('.password-input').querySelector('input');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                e.target.classList.toggle('fa-eye');
                e.target.classList.toggle('fa-eye-slash');
            });
        });

        // Обработчик формы модератора
        document.getElementById('moderatorForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const workerData = {
                    email: document.getElementById('moderatorEmail').value,
                    password: document.getElementById('moderatorPassword').value,
                    fullName: document.getElementById('moderatorFullName').value,
                    phone: document.getElementById('moderatorPhone').value,
                    workerType: 'moderator'
                };
                
                await this.supabaseService.createWorker(
                    workerData.email,
                    workerData.password,
                    workerData.fullName,
                    workerData.phone,
                    workerData.workerType
                );

                const modal = document.getElementById('moderatorModal');
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
                e.target.reset();
                await this.loadWorkers();
                alert('Модератор успешно создан!');
            } catch (error) {
                console.error('Error creating moderator:', error);
                alert('Ошибка при создании модератора: ' + error.message);
            }
        });

        // Обработчик формы продавца
        document.getElementById('sellerForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const workerData = {
                    email: document.getElementById('sellerEmail').value,
                    password: document.getElementById('sellerPassword').value,
                    fullName: document.getElementById('sellerFullName').value,
                    phone: document.getElementById('sellerPhone').value,
                    workerType: 'seller'
                };
                
                await this.supabaseService.createWorker(
                    workerData.email,
                    workerData.password,
                    workerData.fullName,
                    workerData.phone,
                    workerData.workerType
                );

                const modal = document.getElementById('sellerModal');
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
                e.target.reset();
                await this.loadWorkers();
                alert('Продавец успешно создан!');
            } catch (error) {
                console.error('Error creating seller:', error);
                alert('Ошибка при создании продавца: ' + error.message);
            }
        });

        // Обработчик формы доставщика
        document.getElementById('deliveryForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const workerData = {
                    email: document.getElementById('deliveryEmail').value,
                    password: document.getElementById('deliveryPassword').value,
                    fullName: document.getElementById('deliveryFullName').value,
                    phone: document.getElementById('deliveryPhone').value,
                    workerType: 'delivery',
                    vehicleType: document.getElementById('deliveryVehicle').value,
                    deliveryArea: document.getElementById('deliveryArea').value
                };
                
                await this.supabaseService.createWorker(
                    workerData.email,
                    workerData.password,
                    workerData.fullName,
                    workerData.phone,
                    workerData.workerType,
                    null,
                    workerData.vehicleType,
                    workerData.deliveryArea
                );

                const modal = document.getElementById('deliveryModal');
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
                e.target.reset();
                await this.loadWorkers();
                alert('Доставщик успешно создан!');
            } catch (error) {
                console.error('Error creating delivery worker:', error);
                alert('Ошибка при создании доставщика: ' + error.message);
            }
        });
    }

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.toggle('hidden', !show);
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
            // Сброс формы при закрытии
            const form = modal.querySelector('form');
            if (form) form.reset();
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
            await this.loadUsers(); // Перезагрузка списка пользователей
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
            if (!container) return;

            // Сохраняем карточки создания новых пользователей
            const createCards = container.querySelectorAll('.user-card');
            const createCardsHTML = Array.from(createCards)
                .filter(card => card.querySelector('.open-modal'))
                .map(card => card.outerHTML)
                .join('');

            // Добавляем существующих пользователей
            const usersHTML = users.map(user => `
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

            // Объединяем карточки создания и существующих пользователей
            container.innerHTML = createCardsHTML + usersHTML;
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

    setActiveSection(section) {
        // Удаляем активный класс у всех ссылок
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Добавляем активный класс нужной ссылке
        const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Здесь можно добавить логику переключения контента разделов
        console.log('Переход в раздел:', section);
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

    async loadWorkers() {
        try {
            const { data: workers, error } = await this.supabaseService.getWorkers();

            if (error) throw error;

            const workersList = document.getElementById('workersList');
            if (workers && workers.length > 0) {
                workersList.innerHTML = workers.map(worker => `
                    <div class="worker-item ${worker.worker_type}">
                        <div class="worker-info">
                            <div class="worker-icon">
                                <i class="fas ${this.getWorkerIcon(worker.worker_type)}"></i>
                            </div>
                            <div class="worker-details">
                                <h4>${worker.full_name}</h4>
                                <p>${worker.email}</p>
                                <p class="worker-phone">${worker.phone || 'Нет телефона'}</p>
                                <span class="worker-type">${this.getWorkerTypeName(worker.worker_type)}</span>
                                ${worker.location ? `<p class="worker-location"><i class="fas fa-map-marker-alt"></i> ${worker.location}</p>` : ''}
                                ${worker.vehicle_type ? `<p class="worker-vehicle"><i class="fas fa-car"></i> ${this.getVehicleTypeName(worker.vehicle_type)}</p>` : ''}
                                ${worker.delivery_area ? `<p class="worker-area"><i class="fas fa-map"></i> ${worker.delivery_area}</p>` : ''}
                            </div>
                        </div>
                        <div class="worker-actions">
                            <button class="btn btn-sm btn-danger delete-worker" data-id="${worker.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');

                // Добавляем обработчики для кнопок удаления
                document.querySelectorAll('.delete-worker').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const workerId = e.currentTarget.dataset.id;
                        if (confirm('Вы уверены, что хотите удалить этого работника?')) {
                            try {
                                await this.supabaseService.deleteWorker(workerId);
                                await this.loadWorkers();
                            } catch (error) {
                                console.error('Error deleting worker:', error);
                                alert('Ошибка при удалении работника: ' + error.message);
                            }
                        }
                    });
                });
            } else {
                workersList.innerHTML = '<div class="no-workers">Работники не найдены</div>';
            }

            // Инициализируем обработчики модальных окон после обновления содержимого
            window.initModalHandlers();
            window.setupPhoneInputs();

        } catch (error) {
            console.error('Error loading workers:', error);
            document.getElementById('workersList').innerHTML = `
                <div class="error">
                    Ошибка при загрузке работников: ${error.message}
                </div>
            `;
        }
    }

    getWorkerIcon(type) {
        switch (type) {
            case 'moderator':
                return 'fa-user-shield';
            case 'seller':
                return 'fa-store';
            case 'delivery':
                return 'fa-truck';
            default:
                return 'fa-user';
        }
    }

    getWorkerTypeName(type) {
        switch (type) {
            case 'moderator':
                return 'Модератор';
            case 'seller':
                return 'Продавец';
            case 'delivery':
                return 'Доставщик';
            default:
                return 'Неизвестно';
        }
    }

    getVehicleTypeName(type) {
        switch (type) {
            case 'car':
                return 'Автомобиль';
            case 'motorcycle':
                return 'Мотоцикл';
            case 'bicycle':
                return 'Велосипед';
            case 'scooter':
                return 'Самокат';
            default:
                return type;
        }
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const supabase = new SupabaseService();
    let currentUser = null;

    // Auth state change handler
    supabase.client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            showMainContainer();
            loadOrders();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showAuthContainer();
        }
    });

    // Show/hide containers
    function showMainContainer() {
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');
        updateUserInfo();
    }

    function showAuthContainer() {
        document.getElementById('authContainer').classList.remove('hidden');
        document.getElementById('mainContainer').classList.add('hidden');
    }

    function updateUserInfo() {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (currentUser) {
            const name = currentUser.user_metadata.full_name || 'User';
            userAvatar.textContent = name.charAt(0);
            userName.textContent = name;
        }
    }

    // Load and display orders
    async function loadOrders() {
        const content = document.querySelector('.content');
        content.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">Список заказов</h2>
                <button id="refreshOrdersBtn" class="btn btn-primary">
                    <i class="fas fa-sync"></i>
                    Обновить
                </button>
            </div>
            <div id="ordersList" class="orders-container">
                <div class="loading">Загрузка заказов...</div>
            </div>
        `;

        try {
            const { data: orders, error } = await supabase.getOrders();
            if (error) throw error;

            const ordersList = document.getElementById('ordersList');
            if (orders.length === 0) {
                ordersList.innerHTML = '<div class="no-orders">Нет доступных заказов</div>';
                return;
            }

            ordersList.innerHTML = orders.map(order => `
                <div class="order-card" data-order-id="${order.id}">
                    <div class="order-header">
                        <span class="order-number">Заказ #${order.id}</span>
                        <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                    </div>
                    <div class="order-details">
                        <div class="detail-item">
                            <label>Стоимость:</label>
                            <span>${order.total_price} ₽</span>
                        </div>
                        <div class="detail-item">
                            <label>Дата:</label>
                            <span>${new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Телефон:</label>
                            <span>${order.customer_phone}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-sm view-order" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i>
                        Подробнее
                    </button>
                </div>
            `).join('');

            // Add event listeners to order cards
            document.querySelectorAll('.view-order').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const orderId = e.target.closest('.view-order').dataset.orderId;
                    await showOrderDetails(orderId);
                });
            });
        } catch (error) {
            console.error('Error loading orders:', error);
            const ordersList = document.getElementById('ordersList');
            ordersList.innerHTML = '<div class="error">Ошибка загрузки заказов</div>';
        }

        // Add event listener to refresh button
        document.getElementById('refreshOrdersBtn').addEventListener('click', loadOrders);
    }

    // Show order details
    async function showOrderDetails(orderId) {
        const modal = document.getElementById('orderModal');
        try {
            const { data: order, error } = await supabase.getOrderDetails(orderId);
            if (error) throw error;

            document.getElementById('orderNumber').textContent = order.id;
            document.getElementById('orderItems').textContent = order.items;
            document.getElementById('orderPrice').textContent = `${order.total_price} ₽`;
            document.getElementById('orderDateTime').textContent = new Date(order.created_at).toLocaleString();
            document.getElementById('customerPhone').textContent = order.customer_phone;
            document.getElementById('deliveryAddress').textContent = order.delivery_address;

            modal.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading order details:', error);
            alert('Ошибка загрузки деталей заказа');
        }
    }

    // Helper function to get status text
    function getStatusText(status) {
        const statusMap = {
            'pending': 'Ожидает обработки',
            'processing': 'В обработке',
            'delivered': 'Доставлен'
        };
        return statusMap[status] || status;
    }

    // Event listeners
    document.getElementById('refreshOrdersBtn').addEventListener('click', loadOrders);
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('orderModal').classList.add('hidden');
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('.nav-link').dataset.section;
            
            // Remove active class from all links
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            e.target.closest('.nav-link').classList.add('active');

            if (section === 'orders') {
                loadOrders();
            } else if (section === 'workers') {
                loadWorkers();
            }
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await supabase.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });

    // Load and display workers
    async function loadWorkers() {
        const content = document.querySelector('.content');
        content.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">Управление работниками</h2>
                <button id="refreshWorkersBtn" class="btn btn-primary">
                    <i class="fas fa-sync"></i>
                    Обновить
                </button>
            </div>
            <div class="worker-cards">
                <div class="worker-card moderator">
                    <div class="worker-icon">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <h3>Создать модератора</h3>
                    <p>Добавьте нового модератора с правами управления заказами.</p>
                    <button class="btn btn-primary btn-sm open-worker-modal" data-type="moderator">
                        <i class="fas fa-plus"></i>
                        Создать
                    </button>
                </div>

                <div class="worker-card seller">
                    <div class="worker-icon">
                        <i class="fas fa-store"></i>
                    </div>
                    <h3>Создать продавца</h3>
                    <p>Добавьте нового продавца с правами обработки заказов.</p>
                    <button class="btn btn-primary btn-sm open-worker-modal" data-type="seller">
                        <i class="fas fa-plus"></i>
                        Создать
                    </button>
                </div>

                <div class="worker-card delivery">
                    <div class="worker-icon">
                        <i class="fas fa-truck"></i>
                    </div>
                    <h3>Создать доставщика</h3>
                    <p>Добавьте нового доставщика с правами доставки заказов.</p>
                    <button class="btn btn-primary btn-sm open-worker-modal" data-type="delivery">
                        <i class="fas fa-plus"></i>
                        Создать
                    </button>
                </div>
            </div>
            <div id="workersList" class="workers-list">
                <div class="loading">Загрузка работников...</div>
            </div>
        `;

        try {
            const { data: workers, error } = await supabase.client
                .from('workers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const workersList = document.getElementById('workersList');
            if (workers && workers.length > 0) {
                workersList.innerHTML = workers.map(worker => `
                    <div class="worker-item ${worker.worker_type}">
                        <div class="worker-info">
                            <div class="worker-icon">
                                <i class="fas ${this.getWorkerIcon(worker.worker_type)}"></i>
                            </div>
                            <div class="worker-details">
                                <h4>${worker.full_name}</h4>
                                <p>${worker.email}</p>
                                <p class="worker-phone">${worker.phone || 'Нет телефона'}</p>
                                <span class="worker-type">${this.getWorkerTypeName(worker.worker_type)}</span>
                                ${worker.location ? `<p class="worker-location"><i class="fas fa-map-marker-alt"></i> ${worker.location}</p>` : ''}
                                ${worker.vehicle_type ? `<p class="worker-vehicle"><i class="fas fa-car"></i> ${this.getVehicleTypeName(worker.vehicle_type)}</p>` : ''}
                                ${worker.delivery_area ? `<p class="worker-area"><i class="fas fa-map"></i> ${worker.delivery_area}</p>` : ''}
                            </div>
                        </div>
                        <div class="worker-actions">
                            <button class="btn btn-sm btn-danger delete-worker" data-id="${worker.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');

                // Добавляем обработчики для кнопок удаления
                document.querySelectorAll('.delete-worker').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const workerId = e.currentTarget.dataset.id;
                        if (confirm('Вы уверены, что хотите удалить этого работника?')) {
                            try {
                                await supabase.deleteWorker(workerId);
                                await loadWorkers();
                            } catch (error) {
                                console.error('Error deleting worker:', error);
                                alert('Ошибка при удалении работника: ' + error.message);
                            }
                        }
                    });
                });
            } else {
                workersList.innerHTML = '<div class="no-workers">Работники не найдены</div>';
            }

            // Инициализируем обработчики модальных окон после обновления содержимого
            window.initModalHandlers();
            window.setupPhoneInputs();

        } catch (error) {
            console.error('Error loading workers:', error);
            document.getElementById('workersList').innerHTML = `
                <div class="error">
                    Ошибка при загрузке работников: ${error.message}
                </div>
            `;
        }
    }

    function getVehicleTypeName(type) {
        switch (type) {
            case 'car':
                return 'Автомобиль';
            case 'motorcycle':
                return 'Мотоцикл';
            case 'bicycle':
                return 'Велосипед';
            case 'scooter':
                return 'Самокат';
            default:
                return type;
        }
    }

    // Load and display products
    async function loadProducts() {
        const content = document.querySelector('.content');
        content.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">Товары</h2>
                <button id="refreshProductsBtn" class="btn btn-primary">
                    <i class="fas fa-sync"></i>
                    Обновить
                </button>
            </div>
            <div id="productsList" class="products-container">
                <div class="loading">Загрузка товаров...</div>
            </div>
            <button id="addProductBtn" class="add-product-btn">
                <i class="fas fa-plus"></i>
            </button>
        `;

        try {
            const { data: products, error } = await supabase.getProducts();
            if (error) throw error;

            const productsList = document.getElementById('productsList');
            if (products.length === 0) {
                productsList.innerHTML = '<div class="no-products">Нет доступных товаров</div>';
                return;
            }

            productsList.innerHTML = products.map(product => `
                <div class="product-card" data-id="${product.id}">
                    <img src="${product.image_url || 'https://via.placeholder.com/300x200'}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description || 'Нет описания'}</p>
                        <div class="product-price">${product.price} ₽</div>
                        <div class="product-actions">
                            <button class="btn btn-primary edit-product">
                                <i class="fas fa-edit"></i>
                                Редактировать
                            </button>
                            <button class="btn btn-danger delete-product">
                                <i class="fas fa-trash"></i>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Add event listeners
            document.getElementById('refreshProductsBtn').addEventListener('click', loadProducts);
            document.getElementById('addProductBtn').addEventListener('click', () => {
                document.getElementById('productModal').classList.remove('hidden');
            });

            // Add event listeners for edit and delete buttons
            document.querySelectorAll('.edit-product').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productCard = e.target.closest('.product-card');
                    const productId = productCard.dataset.id;
                    editProduct(productId);
                });
            });

            document.querySelectorAll('.delete-product').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productCard = e.target.closest('.product-card');
                    const productId = productCard.dataset.id;
                    deleteProduct(productId);
                });
            });

        } catch (error) {
            console.error('Error loading products:', error);
            const productsList = document.getElementById('productsList');
            productsList.innerHTML = '<div class="error">Ошибка загрузки товаров</div>';
        }
    }

    async function createProduct(e) {
        e.preventDefault();
        
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const imageFile = document.getElementById('productImage').files[0];

        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await supabase.uploadProductImage(imageFile);
            }

            const { error } = await supabase.createProduct({
                name,
                description,
                price,
                image_url: imageUrl
            });

            if (error) throw error;

            document.getElementById('productModal').classList.add('hidden');
            document.getElementById('productForm').reset();
            await loadProducts();
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Ошибка при создании товара: ' + error.message);
        }
    }

    async function editProduct(productId) {
        try {
            const { data: product, error } = await supabase.client
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;

            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            
            const modal = document.getElementById('productModal');
            modal.dataset.editId = productId;
            modal.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading product:', error);
            alert('Ошибка при загрузке товара: ' + error.message);
        }
    }

    async function deleteProduct(productId) {
        if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;

        try {
            const { error } = await supabase.deleteProduct(productId);
            if (error) throw error;
            await loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Ошибка при удалении товара: ' + error.message);
        }
    }

    // Add event listeners for product form
    document.getElementById('productForm')?.addEventListener('submit', createProduct);

    // Add event listener for closing product modal
    document.querySelector('#productModal .close-modal')?.addEventListener('click', () => {
        document.getElementById('productModal').classList.add('hidden');
        document.getElementById('productForm').reset();
    });

    // Update navigation event listener
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('.nav-link').dataset.section;
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            e.target.closest('.nav-link').classList.add('active');

            if (section === 'orders') {
                loadOrders();
            } else if (section === 'workers') {
                loadWorkers();
            } else if (section === 'products') {
                loadProducts();
            }
        });
    });

    // Функция для инициализации обработчиков модальных окон
    window.initModalHandlers = function() {
        // Обработчики для кнопок создания работников
        document.querySelectorAll('.open-worker-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workerType = e.currentTarget.dataset.type;
                const modalId = `${workerType}Modal`;
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        modal.classList.add('active');
                    }, 10);
                }
            });
        });

        // Обработчики для закрытия модальных окон
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                    }, 300);
                    const form = modal.querySelector('form');
                    if (form) form.reset();
                }
            });
        });

        // Предотвращаем закрытие модального окна при клике на его содержимое
        document.querySelectorAll('.modal-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Инициализируем обработчики показа/скрытия пароля
        initPasswordToggles();
    };

    // Вызываем initPasswordToggles при загрузке страницы
    initPasswordToggles();
    
    // Обработчик для кнопки обновления
    document.getElementById('refreshWorkersBtn')?.addEventListener('click', loadWorkers);

    // Обработчики форм создания работников
    document.getElementById('moderatorForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const workerData = {
                email: document.getElementById('moderatorEmail').value,
                password: document.getElementById('moderatorPassword').value,
                fullName: document.getElementById('moderatorFullName').value,
                phone: document.getElementById('moderatorPhone').value,
                workerType: 'moderator'
            };
            
            await supabase.createWorker(
                workerData.email,
                workerData.password,
                workerData.fullName,
                workerData.phone,
                workerData.workerType
            );

            const modal = document.getElementById('moderatorModal');
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
            e.target.reset();
            await loadWorkers();
            alert('Модератор успешно создан!');
        } catch (error) {
            console.error('Error creating moderator:', error);
            alert('Ошибка при создании модератора: ' + error.message);
        }
    });

    // Обработчик для показа/скрытия пароля
    function initPasswordToggles() {
        document.querySelectorAll('.toggle-password').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const passwordInput = e.target.closest('.password-input').querySelector('input');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                e.target.classList.toggle('fa-eye');
                e.target.classList.toggle('fa-eye-slash');
            });
        });
    }
});

// Глобальная функция для форматирования телефонных номеров
window.setupPhoneInputs = function() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    if (!phoneInputs.length) return;
    
    phoneInputs.forEach(input => {
        // Удаляем старые обработчики
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        let previousValue = '';
        
        // При фокусе
        newInput.addEventListener('focus', function() {
            if (!this.value) {
                this.value = '+7 (';
                previousValue = this.value;
            }
        });

        // При вводе
        newInput.addEventListener('input', function(e) {
            let cursorPosition = this.selectionStart;
            let value = this.value.replace(/\D/g, '');
            let formattedValue = '';
            
            if (value.length >= 1) {
                if (value[0] !== '7') {
                    value = '7' + value;
                }
                formattedValue = '+7';
                if (value.length > 1) {
                    formattedValue += ' (' + value.substring(1, 4);
                }
                if (value.length >= 4) {
                    formattedValue += ') ' + value.substring(4, 7);
                }
                if (value.length >= 7) {
                    formattedValue += '-' + value.substring(7, 9);
                }
                if (value.length >= 9) {
                    formattedValue += '-' + value.substring(9, 11);
                }
            }
            
            if (formattedValue) {
                this.value = formattedValue;
                
                // Восстанавливаем позицию курсора
                if (cursorPosition < previousValue.length) {
                    this.setSelectionRange(cursorPosition, cursorPosition);
                }
            }
            
            previousValue = this.value;
        });

        // При вставке
        newInput.addEventListener('paste', function(e) {
            e.preventDefault();
            let pastedText = (e.clipboardData || window.clipboardData).getData('text');
            let value = pastedText.replace(/\D/g, '');
            
            if (value) {
                if (value[0] !== '7') {
                    value = '7' + value;
                }
                let formattedValue = '+7';
                if (value.length > 1) {
                    formattedValue += ' (' + value.substring(1, 4);
                }
                if (value.length >= 4) {
                    formattedValue += ') ' + value.substring(4, 7);
                }
                if (value.length >= 7) {
                    formattedValue += '-' + value.substring(7, 9);
                }
                if (value.length >= 9) {
                    formattedValue += '-' + value.substring(9, 11);
                }
                
                this.value = formattedValue;
            }
        });

        // При нажатии клавиш
        newInput.addEventListener('keydown', function(e) {
            // Разрешаем: backspace, delete, tab и escape
            if (e.keyCode == 46 || e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 27 ||
                // Разрешаем: Ctrl+A
                (e.keyCode == 65 && e.ctrlKey === true) ||
                // Разрешаем: home, end, влево, вправо
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                return;
            }
            // Запрещаем все, кроме цифр на основной клавиатуре и цифр на цифровой клавиатуре
            if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    });
};

// Вспомогательные функции для отображения работников
window.getWorkerIcon = function(type) {
    switch (type) {
        case 'moderator':
            return 'fa-user-shield';
        case 'seller':
            return 'fa-store';
        case 'delivery':
            return 'fa-truck';
        default:
            return 'fa-user';
    }
};

window.getWorkerTypeName = function(type) {
    switch (type) {
        case 'moderator':
            return 'Модератор';
        case 'seller':
            return 'Продавец';
        case 'delivery':
            return 'Доставщик';
        default:
            return 'Неизвестно';
    }
};

window.getVehicleTypeName = function(type) {
    switch (type) {
        case 'car':
            return 'Автомобиль';
        case 'motorcycle':
            return 'Мотоцикл';
        case 'bicycle':
            return 'Велосипед';
        case 'scooter':
            return 'Самокат';
        default:
            return type;
    }
};
