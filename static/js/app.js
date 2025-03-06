// API backend URL
const API_URL = 'http://localhost:5000';

// Global state
let currentFilter = 'all';
let tasks = [];

// Initialzes reuired DOM element 
const authContainer = document.getElementById('auth-container');
const taskContainer = document.getElementById('task-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const tasksList = document.getElementById('tasks-list');
const taskForm = document.getElementById('task-form');
const taskTitle = document.getElementById('task-title');
const taskDescription = document.getElementById('task-description');
const logoutBtn = document.getElementById('logout-btn');
const usernameDisplay = document.getElementById('username');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editTaskId = document.getElementById('edit-task-id');
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskDescription = document.getElementById('edit-task-description');
const editTaskCompleted = document.getElementById('edit-task-completed');
const closeModal = document.querySelector('.close');
const tabBtns = document.querySelectorAll('.tab-btn');
const filterBtns = document.querySelectorAll('.filter-btn');



// Event listeners
document.addEventListener('DOMContentLoaded', initApp);
tabBtns.forEach(btn => btn.addEventListener('click', switchTab));
loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);
taskForm.addEventListener('submit', handleAddTask);
logoutBtn.addEventListener('click', handleLogout);
editForm.addEventListener('submit', handleUpdateTask);
closeModal.addEventListener('click', () => editModal.style.display = 'none');
filterBtns.forEach(btn => btn.addEventListener('click', handleFilterChange));
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.style.display = 'none';
    }
});

// Initialize app
function initApp() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token) {
        authContainer.classList.add('hidden');
        taskContainer.classList.remove('hidden');
        usernameDisplay.textContent = username;
        fetchTasks();
    } else {
        authContainer.classList.remove('hidden');
        taskContainer.classList.add('hidden');
    }
}

// Switch between login and register tabs
function switchTab(e) {
    const tabName = e.target.dataset.tab;
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tabName}-form`).classList.add('active');
}

// Handle filter change
function handleFilterChange(e) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    currentFilter = e.target.dataset.filter;
    renderTasks();
}

// Authentication
async function handleLogin() {
    loginError.textContent = '';
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    if (!username || !password) {
        loginError.textContent = 'Please fill both the fields';
        return;
    }
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        
        authContainer.classList.add('hidden');
        taskContainer.classList.remove('hidden');
        usernameDisplay.textContent = username;
        
        fetchTasks();
    } catch (error) {
        loginError.textContent = error.message;
    }
}

async function handleRegister() {
    registerError.textContent = '';
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    if (!username || !email || !password) {
        registerError.textContent = 'Please fill in All fields all fields are required';
        return;
    }
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        document.querySelector('[data-tab="login"]').click();
        registerError.textContent = '';
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = password;
    } catch (error) {
        registerError.textContent = error.message;
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    authContainer.classList.remove('hidden');
    taskContainer.classList.add('hidden');
    tasks = [];
}

// Task CRUD operations perform 
async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: {
                'x-access-token': localStorage.getItem('token')
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        tasks = data.tasks;
        renderTasks();
    } catch (error) {
        console.error(error);
    }
}

async function handleAddTask(e) {
    e.preventDefault();
    
    const title = taskTitle.value;
    const description = taskDescription.value;
    if (!title) return;
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ title, description })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error('Failed to add task!');
        }
        
        const data = await response.json();
        tasks.push(data.task);
        renderTasks();
        taskTitle.value = '';
        taskDescription.value = '';
    } catch (error) {
        console.error(error);
    }
}

async function handleUpdateTask(e) {
    e.preventDefault();
    
    const id = editTaskId.value;
    const title = editTaskTitle.value;
    const description = editTaskDescription.value;
    const completed = editTaskCompleted.checked;
    if (!title) return;
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ title, description, completed })
        });
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error('Failed to update task!');
        }
        
        const data = await response.json();
        const index = tasks.findIndex(task => task.id === parseInt(id));
        if (index !== -1) {
            tasks[index] = data.task;
        }
        
        renderTasks();
        editModal.style.display = 'none';
    } catch (error) {
        console.error(error);
    }
}

async function handleDeleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: {
                'x-access-token': localStorage.getItem('token')
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error('Failed to delete task');
        }
        
        tasks = tasks.filter(task => task.id !== id);
        renderTasks();
    } catch (error) {
        console.error(error);
    }
}

function handleEditTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    
    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskDescription.value = task.description;
    editTaskCompleted.checked = task.completed;
    
    editModal.style.display = 'block';
}

function handleToggleComplete(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    const completed = !task.completed;
    fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ 
            title: task.title, 
            description: task.description, 
            completed 
        })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error('Failed to update task');
        }
        return response.json();
    })
    .then(data => {
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = data.task;
        }
        renderTasks();
    })
    .catch(error => console.error(error));
}

function renderTasks() {
    tasksList.innerHTML = '';
    let filteredTasks = [...tasks];
    
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `<p class="no-tasks">No tasks found</p>`;
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-item');
        if (task.completed) {
            taskElement.classList.add('task-completed');
        }
        
        const createdDate = new Date(task.created_at).toLocaleDateString();
        
        taskElement.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <h3 class="task-title">${task.title}</h3>
                <p class="task-description">${task.description || 'No description'}</p>
                <small>Created on ${createdDate}</small>
            </div>
            <div class="task-actions">
                <button class="task-btn task-edit" title="Edit task"><i class="fas fa-edit"></i></button>
                <button class="task-btn task-delete" title="Delete task"><i class="fas fa-trash"></i></button>
            </div>
        `;
        const checkbox = taskElement.querySelector('.task-checkbox');
        const editBtn = taskElement.querySelector('.task-edit');
        const deleteBtn = taskElement.querySelector('.task-delete');
        
        checkbox.addEventListener('change', () => handleToggleComplete(task.id));
        editBtn.addEventListener('click', () => handleEditTask(task.id));
        deleteBtn.addEventListener('click', () => handleDeleteTask(task.id));
        
        tasksList.appendChild(taskElement);
    });
}