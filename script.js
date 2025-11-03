document.addEventListener('DOMContentLoaded', () => {

    // --- 1. AUTHENTICATION CHECK & USER SETUP ---
    const currentUser = localStorage.getItem('planner_currentUser');
    if (!currentUser) {
        // Not logged in! Redirect to login page.
        window.location.href = 'login.html';
        return; // Stop running this script
    }

    // --- 2. GET HTML ELEMENTS ---
    const taskInput = document.getElementById('task-input');
    const dueDateInput = document.getElementById('due-date-input');
    const difficultyInput = document.getElementById('difficulty-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskListDiv = document.getElementById('task-list');
    const generatePlanBtn = document.getElementById('generate-plan-btn');
    const studyPlanDiv = document.getElementById('study-plan');

    // User elements
    const welcomeMsg = document.getElementById('welcome-msg');
    const logoutBtn = document.getElementById('logout-btn');

    welcomeMsg.textContent = `Welcome, ${currentUser}!`; // Personalize!

    let tasks = [];

    // --- 3. DATA & AUTH FUNCTIONS ---

    function logout() {
        localStorage.removeItem('planner_currentUser'); // Log out
        window.location.href = 'login.html'; // Go back to login
    }

    function saveTasks() {
        // Save tasks under a key unique to the current user
        localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
    }

    function loadTasks() {
        const savedTasks = localStorage.getItem(`tasks_${currentUser}`);
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        } else {
            tasks = [];
        }
    }

    // --- 4. ADD EVENT LISTENERS ---
    addTaskBtn.addEventListener('click', addTask);
    generatePlanBtn.addEventListener('click', generatePlan);
    logoutBtn.addEventListener('click', logout);

    // --- 5. CORE APP FUNCTIONS ---

    function addTask() {
        const taskName = taskInput.value.trim();
        const dueDate = dueDateInput.value;
        const difficulty = difficultyInput.value;
        const difficultyText = difficultyInput.options[difficultyInput.selectedIndex].text;

        if (taskName === '' || dueDate === '') {
            alert('Please enter both a task and a due date.');
            return;
        }

        const task = {
            id: Date.now(),
            name: taskName,
            dueDate: dueDate,
            difficulty: parseInt(difficulty),
            difficultyText: difficultyText,
            completed: false
        };

        tasks.push(task);
        saveTasks();
        renderTasks();

        taskInput.value = '';
        dueDateInput.value = '';
        difficultyInput.value = '3';
    }

    function renderTasks() {
        taskListDiv.innerHTML = '';
        
        // Sort tasks: completed at the bottom
        const sortedTasks = [...tasks].sort((a, b) => a.completed - b.completed);

        if (sortedTasks.length === 0) {
            taskListDiv.innerHTML = '<p>No tasks added yet.</p>';
            return;
        }

        sortedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');
            
            if (task.completed) {
                taskElement.classList.add('completed');
            }

            const formattedDate = new Date(task.dueDate).toLocaleDateString("en-US", { timeZone: 'UTC' });

            taskElement.innerHTML = `
                <div class="task-info">
                    <span><strong>${task.name}</strong> (Due: ${formattedDate})</span>
                    <br>
                    <small>Difficulty: ${task.difficultyText}</small>
                </div>
                <div class="task-actions">
                    <button class="complete-btn" data-id="${task.id}" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                        <i class="fa-solid ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="delete-btn" data-id="${task.id}" title="Delete task">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            
            taskElement.querySelector('.delete-btn').addEventListener('click', deleteTask);
            taskElement.querySelector('.complete-btn').addEventListener('click', toggleComplete);

            taskListDiv.appendChild(taskElement);
        });
    }

    function deleteTask(event) {
        const taskIdToDelete = Number(event.currentTarget.getAttribute('data-id'));
        tasks = tasks.filter(task => task.id !== taskIdToDelete);
        saveTasks();
        renderTasks();
        // Clear plan since list changed
        studyPlanDiv.innerHTML = '<p class="placeholder">Your generated plan will appear here...</p>';
    }

    function toggleComplete(event) {
        const taskIdToToggle = Number(event.currentTarget.getAttribute('data-id'));
        const task = tasks.find(task => task.id === taskIdToToggle);
        
        if (task) {
            task.completed = !task.completed;
        }
        saveTasks();
        renderTasks();
        // Clear plan since list changed
        studyPlanDiv.innerHTML = '<p class="placeholder">Your generated plan will appear here...</p>';
    }


    /**
     * =======================================================
     * 🧠 THE "AI" LOGIC: Weighted Priority Algorithm
     * =======================================================
     */
    function generatePlan() {
        const tasksToPlan = tasks.filter(task => !task.completed);

        if (tasksToPlan.length === 0) {
            studyPlanDiv.innerHTML = '<p class="placeholder">All tasks are complete, or no tasks have been added!</p>';
            return;
        }

        studyPlanDiv.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasksWithPriority = tasksToPlan.map(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
            
            // Priority Score: Lower score = HIGHER urgency (Days Remaining minus a fraction of Difficulty)
            const priorityScore = daysRemaining - (task.difficulty / 10); 

            return { ...task, daysRemaining: daysRemaining, priorityScore: priorityScore };
        });

        // Sort by the calculated AI Priority Score
        tasksWithPriority.sort((a, b) => a.priorityScore - b.priorityScore);

        // Generate the plan based on rules
        tasksWithPriority.forEach(task => {
            let priority = '';
            let recommendation = '';
            let priorityClass = '';
            let difficultyTag = `<span class="difficulty-tag">${task.difficultyText}</span>`;

            // Rules Engine based on the priority score and days
            if (task.daysRemaining <= 1) {
                priority = 'URGENT';
                priorityClass = 'priority-urgent';
                recommendation = `Due tomorrow! You must focus on this **immediately** before starting anything else.`;
            } else if (task.priorityScore <= 3) {
                priority = 'High Priority';
                priorityClass = 'priority-high';
                recommendation = `This task is high priority (${task.daysRemaining} days left). Dedicate a substantial study block to this today.`;
            } else if (task.priorityScore <= 7) {
                priority = 'Medium Priority';
                priorityClass = 'priority-medium';
                recommendation = `You have time. Break this task into 2-3 manageable chunks and start the first one today.`;
            } else {
                priority = 'Low Priority';
                priorityClass = 'priority-low';
                recommendation = `You have plenty of time. Schedule a short, initial review session this week to gather materials.`;
            }
            
            // Specialized Advice Rule
            if (task.difficulty === 5 && task.daysRemaining > 3) {
                recommendation += ` Since this is a **Hard** task, the AI advises you to budget for extra time and break it into 3-4 smaller parts.`;
            }

            const planItem = document.createElement('div');
            planItem.classList.add('plan-item', priorityClass);
            planItem.innerHTML = `
                <h3>${task.name} ${difficultyTag}</h3>
                <p><strong>Priority:</strong> ${priority}</p>
                <p><strong>AI Suggestion:</strong> ${recommendation}</p>
            `;
            studyPlanDiv.appendChild(planItem);
        });
    }

    // --- 6. INITIALIZATION ---
    loadTasks();
    renderTasks();
});