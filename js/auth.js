document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const authContainer = document.getElementById('authContainer');
    const mainContainer = document.getElementById('mainContainer');
    const authError = document.getElementById('authError');
    const logoutBtn = document.getElementById('logoutBtn');
    const togglePassword = document.getElementById('togglePassword');
    const authPassword = document.getElementById('authPassword');
    const googleAuthBtn = document.getElementById('googleAuthBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const supabaseService = new SupabaseService();
    let isAuthenticating = false;

    // Предварительно скрываем контейнеры до проверки авторизации
    authContainer.style.opacity = '0';
    mainContainer.style.opacity = '0';

    function setLoading(isLoading) {
        if (isLoading) {
            loadingSpinner.classList.add('visible');
            authContainer.classList.add('loading');
            if (isAuthenticating) {
                authContainer.style.opacity = '0.5';
            }
        } else {
            loadingSpinner.classList.remove('visible');
            authContainer.classList.remove('loading');
            authContainer.style.opacity = '1';
        }
    }

    function showContainer(container, show) {
        if (show) {
            container.classList.remove('hidden');
            // Используем setTimeout для плавного появления
            setTimeout(() => {
                container.style.opacity = '1';
            }, 50);
        } else {
            container.style.opacity = '0';
            // Ждем окончания анимации перед скрытием
            setTimeout(() => {
                container.classList.add('hidden');
            }, 300);
        }
    }

    togglePassword.addEventListener('click', () => {
        if (authPassword.type === 'password') {
            authPassword.type = 'text';
            togglePassword.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            authPassword.type = 'password';
            togglePassword.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);
        const email = document.getElementById('authEmail').value;
        const password = authPassword.value;

        if (email !== 'pereprice@gmail.com') {
            showAuthError('Доступ разрешен только для pereprice@gmail.com');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabaseService.signIn(email, password);
            
            if (error) throw error;
            
            localStorage.setItem('sb-auth-token', data.session.access_token);
            updateUserInfo(data.user);
            showContainer(authContainer, false);
            showContainer(mainContainer, true);
        } catch (error) {
            showAuthError(error.message);
        } finally {
            setLoading(false);
        }
    });

    googleAuthBtn.addEventListener('click', async () => {
        try {
            isAuthenticating = true;
            setLoading(true);
            
            // Сохраняем текущее состояние для восстановления после редиректа
            sessionStorage.setItem('auth_in_progress', 'true');
            
            const { data, error } = await supabaseService.client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });
            
            if (error) throw error;
            
        } catch (error) {
            console.error('Ошибка входа через Google:', error);
            showAuthError('Ошибка входа через Google: ' + error.message);
            setLoading(false);
            isAuthenticating = false;
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            setLoading(true);
            await supabaseService.signOut();
            localStorage.removeItem('sb-auth-token');
            sessionStorage.removeItem('auth_in_progress');
            showContainer(mainContainer, false);
            showContainer(authContainer, true);
            authForm.reset();
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            setLoading(false);
        }
    });

    async function initializeAuth() {
        // Проверяем, был ли начат процесс аутентификации
        const authInProgress = sessionStorage.getItem('auth_in_progress');
        if (authInProgress) {
            setLoading(true);
            isAuthenticating = true;
        }

        try {
            const { data: sessionData, error: sessionError } = await supabaseService.client.auth.getSession();
            
            if (sessionError) throw sessionError;

            let user = null;
            let token = localStorage.getItem('sb-auth-token');

            if (sessionData.session) {
                user = sessionData.session.user;
                token = sessionData.session.access_token;
                localStorage.setItem('sb-auth-token', token);
            } else if (token) {
                const { data: userData, error: userError } = await supabaseService.client.auth.getUser(token);
                if (userError) throw userError;
                user = userData.user;
            }

            if (user) {
                if (user.email !== 'pereprice@gmail.com') {
                    await supabaseService.signOut();
                    localStorage.removeItem('sb-auth-token');
                    sessionStorage.removeItem('auth_in_progress');
                    showAuthError('Доступ разрешен только для pereprice@gmail.com');
                    showContainer(authContainer, true);
                    return;
                }

                updateUserInfo(user);
                showContainer(authContainer, false);
                showContainer(mainContainer, true);
            } else {
                showContainer(authContainer, true);
            }
        } catch (error) {
            console.error('Ошибка инициализации авторизации:', error);
            localStorage.removeItem('sb-auth-token');
            sessionStorage.removeItem('auth_in_progress');
            showContainer(authContainer, true);
        } finally {
            setLoading(false);
            isAuthenticating = false;
            sessionStorage.removeItem('auth_in_progress');
        }
    }

    function updateUserInfo(user) {
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        userName.textContent = name;
        userAvatar.textContent = initials.slice(0, 2);
    }

    function showAuthError(message) {
        authError.textContent = message || 'Неверные учетные данные!';
        authError.style.display = 'block';
        setTimeout(() => {
            authError.style.display = 'none';
        }, 3000);
    }

    // Инициируем проверку авторизации
    initializeAuth();
});
