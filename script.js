// Global variables
let currentWeek = 1;
let currentEnergyLevel = 3;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadAllData();
    initializeEventListeners();
});

function initializeApp() {
    // Set initial date for food log to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('food-date').value = today;
    
    // Initialize exercise types
    initializeExerciseTypes();
    
    // Generate activity grid
    generateActivityGrid();
    
    // Load initial gallery
    loadGallery();
}

function initializeEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Form submissions
    document.getElementById('foodForm').addEventListener('submit', handleFoodSubmit);
    document.getElementById('activityForm').addEventListener('submit', handleActivitySubmit);
    
    // BMI photo upload
    document.getElementById('bmi-photo').addEventListener('change', handleBmiPhotoUpload);
}

// Theme Management
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    localStorage.setItem('theme', newTheme);
}

// BMI Calculator
function calculateBMI() {
    const height = parseFloat(document.getElementById('height').value) / 100; // Convert to meters
    const weight = parseFloat(document.getElementById('weight').value);
    
    if (!height || !weight) {
        alert('Please enter both height and weight.');
        return;
    }
    
    const bmi = weight / (height * height);
    const category = getBMICategory(bmi);
    
    document.getElementById('bmi-value').textContent = bmi.toFixed(1);
    document.getElementById('bmi-category').textContent = category;
    document.getElementById('bmi-result').style.display = 'block';
    
    // Update BMI meter
    updateBMIMeter(bmi);
    
    // Save BMI data
    saveBMIData(bmi, category);
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
}

function updateBMIMeter(bmi) {
    const needle = document.getElementById('bmi-needle');
    let position = 0;
    
    if (bmi < 18.5) position = (bmi / 18.5) * 25;
    else if (bmi < 25) position = 25 + ((bmi - 18.5) / 6.5) * 25;
    else if (bmi < 30) position = 50 + ((bmi - 25) / 5) * 25;
    else position = 75 + (Math.min((bmi - 30) / 10, 1) * 25);
    
    needle.style.left = `${position}%`;
}

function saveBMIData(bmi, category) {
    const bmiData = {
        value: bmi,
        category: category,
        date: new Date().toISOString(),
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value
    };
    
    localStorage.setItem('bmiData', JSON.stringify(bmiData));
}

function handleBmiPhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('bmi-preview');
            preview.innerHTML = `<img src="${e.target.result}" alt="BMI Evidence">`;
            
            // Save photo data
            const bmiData = JSON.parse(localStorage.getItem('bmiData') || '{}');
            bmiData.photo = e.target.result;
            localStorage.setItem('bmiData', JSON.stringify(bmiData));
            
            // Add to gallery
            addToGallery('bmi', e.target.result, 'BMI Measurement');
        };
        reader.readAsDataURL(file);
    }
}

// Goals and FITT Management
function updateGoal() {
    const goal = document.getElementById('specific').value;
    const frequency = document.getElementById('achievable').value;
    document.getElementById('frequency').value = `${frequency} days/week`;
    
    // Update exercise types based on goal
    updateExerciseTypes(goal);
}

function initializeExerciseTypes() {
    const typesContainer = document.getElementById('exercise-types');
    const exerciseTypes = [
        'Strength Training', 'Cardio', 'Bodyweight Exercises', 'Yoga',
        'Running', 'Cycling', 'Swimming', 'Sports', 'HIIT'
    ];
    
    typesContainer.innerHTML = exerciseTypes.map(type => `
        <label>
            <input type="checkbox" value="${type}"> ${type}
        </label>
    `).join('');
}

function updateExerciseTypes(goal) {
    const checkboxes = document.querySelectorAll('#exercise-types input');
    
    checkboxes.forEach(checkbox => {
        const type = checkbox.value.toLowerCase();
        let shouldShow = true;
        
        switch(goal) {
            case 'build muscle':
                shouldShow = ['strength training', 'bodyweight exercises', 'hiit'].includes(type);
                break;
            case 'lose fat':
                shouldShow = ['cardio', 'hiit', 'running', 'cycling', 'swimming'].includes(type);
                break;
            case 'improve endurance':
                shouldShow = ['cardio', 'running', 'cycling', 'swimming', 'sports'].includes(type);
                break;
        }
        
        checkbox.parentElement.style.display = shouldShow ? 'block' : 'none';
        if (!shouldShow) checkbox.checked = false;
    });
}

function saveGoals() {
    const goals = {
        specific: document.getElementById('specific').value,
        measurable: document.getElementById('measurable').value,
        achievable: document.getElementById('achievable').value,
        relevant: document.getElementById('relevant').value,
        fitt: {
            frequency: document.getElementById('frequency').value,
            intensity: document.getElementById('intensity').value,
            time: document.getElementById('time').value,
            type: Array.from(document.querySelectorAll('#exercise-types input:checked')).map(cb => cb.value)
        },
        date: new Date().toISOString()
    };
    
    localStorage.setItem('goalsData', JSON.stringify(goals));
    alert('Goals and FITT plan saved successfully!');
}

// Activity Log Management
function generateActivityGrid() {
    const grid = document.getElementById('activity-grid');
    const timeSlots = [
        '5AM-6AM', '6AM-7AM', '7AM-8AM', '8AM-9AM', '9AM-10AM', '10AM-11AM', '11AM-12PM',
        '12PM-1PM', '1PM-2PM', '2PM-3PM', '3PM-4PM', '4PM-5PM', '5PM-6PM', '6PM-7PM',
        '7PM-8PM', '8PM-9PM', '9PM-10PM'
    ];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    let gridHTML = '<div class="time-slot"></div>';
    
    // Day headers
    days.forEach(day => {
        gridHTML += `<div class="day-header">${getDayDate(day, currentWeek)}</div>`;
    });
    
    // Time slots and cells
    timeSlots.forEach(timeSlot => {
        gridHTML += `<div class="time-slot">${timeSlot}</div>`;
        days.forEach(day => {
            const timeKey = `${getDayDate(day, currentWeek)}-${timeSlot}`;
            gridHTML += `
                <div class="activity-cell" onclick="openActivityModal('${timeKey}')" 
                     id="cell-${timeKey.replace(/[/]/g, '-')}">
                    <!-- Activity entries will be populated here -->
                </div>
            `;
        });
    });
    
    grid.innerHTML = gridHTML;
    updateWeekDisplay();
    loadActivitiesForWeek();
}

function getDayDate(day, week) {
    const startDate = new Date('2024-10-20');
    const dayOffset = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(day);
    const weekOffset = (week - 1) * 7;
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + weekOffset + dayOffset);
    
    return targetDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
}

function changeWeek(direction) {
    currentWeek += direction;
    if (currentWeek < 1) currentWeek = 1;
    if (currentWeek > 4) currentWeek = 4;
    
    generateActivityGrid();
}

function updateWeekDisplay() {
    const startDate = new Date('2024-10-20');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6 + (currentWeek - 1) * 7);
    
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    document.getElementById('current-week').textContent = `Week ${currentWeek}: ${startStr} - ${endStr}`;
}

function openActivityModal(timeSlot) {
    document.getElementById('activityTimeSlot').value = timeSlot;
    document.getElementById('activityModal').style.display = 'block';
    resetEnergyStars();
}

function closeActivityModal() {
    document.getElementById('activityModal').style.display = 'none';
    document.getElementById('activityForm').reset();
}

function setEnergy(level) {
    currentEnergyLevel = level;
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < level);
    });
    document.getElementById('activityEnergy').value = level;
}

function resetEnergyStars() {
    currentEnergyLevel = 3;
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < 3);
    });
    document.getElementById('activityEnergy').value = 3;
}

function handleActivitySubmit(event) {
    event.preventDefault();
    
    const timeSlot = document.getElementById('activityTimeSlot').value;
    const activityData = {
        type: document.getElementById('activityType').value,
        details: document.getElementById('activityDetails').value,
        energy: document.getElementById('activityEnergy').value,
        timestamp: new Date().toISOString()
    };
    
    // Handle photo upload
    const photoFile = document.getElementById('activityPhoto').files[0];
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            activityData.photo = e.target.result;
            saveActivityData(timeSlot, activityData);
        };
        reader.readAsDataURL(photoFile);
    } else {
        saveActivityData(timeSlot, activityData);
    }
    
    closeActivityModal();
}

function saveActivityData(timeSlot, activityData) {
    const activities = JSON.parse(localStorage.getItem('activities') || '{}');
    activities[timeSlot] = activityData;
    localStorage.setItem('activities', JSON.stringify(activities));
    
    updateActivityCell(timeSlot, activityData);
    
    // Add to gallery if there's a photo
    if (activityData.photo) {
        addToGallery('workout', activityData.photo, `Workout: ${activityData.type}`);
    }
}

function updateActivityCell(timeSlot, activityData) {
    const cell = document.getElementById(`cell-${timeSlot.replace(/[/]/g, '-')}`);
    if (cell) {
        cell.innerHTML = `
            <div class="activity-entry activity-${activityData.type}">
                <strong>${activityData.type}</strong>
                ${activityData.details ? `<br>${activityData.details}` : ''}
                <br>Energy: ${'★'.repeat(activityData.energy)}
            </div>
        `;
    }
}

function loadActivitiesForWeek() {
    const activities = JSON.parse(localStorage.getItem('activities') || '{}');
    
    Object.keys(activities).forEach(timeSlot => {
        // Check if this time slot belongs to current week
        const [date] = timeSlot.split('-');
        if (isDateInCurrentWeek(date)) {
            updateActivityCell(timeSlot, activities[timeSlot]);
        }
    });
}

function isDateInCurrentWeek(dateString) {
    // Simplified check - in a real app, you'd want more robust date checking
    return true;
}

// Food Log Management
function openFoodModal(mealType) {
    document.getElementById('currentMeal').value = mealType;
    document.getElementById('foodModal').style.display = 'block';
}

function closeFoodModal() {
    document.getElementById('foodModal').style.display = 'none';
    document.getElementById('foodForm').reset();
}

function handleFoodSubmit(event) {
    event.preventDefault();
    
    const mealType = document.getElementById('currentMeal').value;
    const foodData = {
        name: document.getElementById('foodName').value,
        quantity: document.getElementById('foodQuantity').value,
        protein: parseFloat(document.getElementById('foodProtein').value),
        carbs: parseFloat(document.getElementById('foodCarbs').value),
        fat: parseFloat(document.getElementById('foodFat').value),
        calories: parseFloat(document.getElementById('foodCalories').value),
        timestamp: new Date().toISOString()
    };
    
    // Handle photo upload
    const photoFile = document.getElementById('foodPhoto').files[0];
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            foodData.photo = e.target.result;
            saveFoodData(mealType, foodData);
        };
        reader.readAsDataURL(photoFile);
    } else {
        saveFoodData(mealType, foodData);
    }
    
    closeFoodModal();
}

function saveFoodData(mealType, foodData) {
    const date = document.getElementById('food-date').value;
    const foodLog = JSON.parse(localStorage.getItem('foodLog') || '{}');
    
    if (!foodLog[date]) {
        foodLog[date] = {};
    }
    if (!foodLog[date][mealType]) {
        foodLog[date][mealType] = [];
    }
    
    foodLog[date][mealType].push(foodData);
    localStorage.setItem('foodLog', JSON.stringify(foodLog));
    
    // Update display
    loadFoodLog();
    
    // Update macronutrient tracker
    updateMacronutrientTracker(date);
    
    // Add to gallery if there's a photo
    if (foodData.photo) {
        addToGallery('food', foodData.photo, `Food: ${foodData.name}`);
    }
}

function loadFoodLog() {
    const date = document.getElementById('food-date').value;
    const foodLog = JSON.parse(localStorage.getItem('foodLog') || '{}');
    const dailyLog = foodLog[date] || {};
    
    // Clear all meal entries
    document.querySelectorAll('.meal-entries').forEach(container => {
        container.innerHTML = '';
    });
    
    // Populate meal entries
    Object.keys(dailyLog).forEach(mealType => {
        const container = document.querySelector(`[data-meal="${mealType}"] .meal-entries`);
        dailyLog[mealType].forEach(food => {
            const entry = document.createElement('div');
            entry.className = 'meal-entry';
            entry.innerHTML = `
                <strong>${food.name}</strong> (${food.quantity})<br>
                Protein: ${food.protein}g | Carbs: ${food.carbs}g | Fat: ${food.fat}g<br>
                Calories: ${food.calories}
            `;
            container.appendChild(entry);
        });
    });
    
    updateMacronutrientTracker(date);
}

function updateMacronutrientTracker(date) {
    const foodLog = JSON.parse(localStorage.getItem('foodLog') || '{}');
    const dailyLog = foodLog[date] || {};
    
    let totalProtein = 0;
    let totalCalories = 0;
    
    Object.values(dailyLog).forEach(meal => {
        meal.forEach(food => {
            totalProtein += food.protein;
            totalCalories += food.calories;
        });
    });
    
    // Update display
    document.getElementById('protein-current').textContent = totalProtein;
    document.getElementById('calories-current').textContent = totalCalories;
    
    // Update progress bars
    const proteinTarget = 140; // This could be calculated based on user data
    const caloriesTarget = 2000; // This could be calculated based on user data
    
    document.getElementById('protein-bar').style.width = `${Math.min((totalProtein / proteinTarget) * 100, 100)}%`;
    document.getElementById('calories-bar').style.width = `${Math.min((totalCalories / caloriesTarget) * 100, 100)}%`;
}

// Gallery Management
function addToGallery(type, photoData, description) {
    const gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
    
    gallery.push({
        type: type,
        photo: photoData,
        description: description,
        date: new Date().toISOString(),
        week: currentWeek
    });
    
    localStorage.setItem('gallery', JSON.stringify(gallery));
    loadGallery();
}

function loadGallery() {
    const gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
    const grid = document.getElementById('gallery-grid');
    
    grid.innerHTML = gallery.map((item, index) => `
        <div class="gallery-item" data-type="${item.type}" data-week="${item.week}">
            <img src="${item.photo}" alt="${item.description}">
            <div class="gallery-info">
                <strong>${item.description}</strong>
                <p>Week ${item.week} • ${new Date(item.date).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

function filterGallery() {
    const typeFilter = document.getElementById('gallery-filter').value;
    const weekFilter = document.getElementById('week-filter').value;
    
    document.querySelectorAll('.gallery-item').forEach(item => {
        const itemType = item.getAttribute('data-type');
        const itemWeek = item.getAttribute('data-week');
        
        const typeMatch = typeFilter === 'all' || itemType === typeFilter;
        const weekMatch = weekFilter === 'all' || itemWeek === weekFilter;
        
        item.style.display = typeMatch && weekMatch ? 'block' : 'none';
    });
}

// FitCoach AI Chat
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('active');
}

function askSuggestion(type) {
    const messages = document.getElementById('chatMessages');
    
    // Add user message
    let userMessage = '';
    switch(type) {
        case 'food':
            userMessage = 'Any suggestions for food today?';
            break;
        case 'workout':
            userMessage = 'What\'s a good workout for me today?';
            break;
        case 'protein':
            userMessage = 'How am I doing on protein today?';
            break;
    }
    
    addMessage(userMessage, 'user');
    
    // Generate AI response
    setTimeout(() => {
        const response = generateAIResponse(type);
        addMessage(response, 'bot');
    }, 1000);
}

function generateAIResponse(type) {
    const foodLog = JSON.parse(localStorage.getItem('foodLog') || '{}');
    const today = new Date().toISOString().split('T')[0];
    const todayLog = foodLog[today] || {};
    
    let totalProtein = 0;
    Object.values(todayLog).forEach(meal => {
        meal.forEach(food => {
            totalProtein += food.protein;
        });
    });
    
    switch(type) {
        case 'food':
            if (totalProtein < 50) {
                return "Based on your intake today, you're low on protein. I suggest grilled chicken breast (30g protein) or Greek yogurt (20g protein) for your next meal.";
            } else {
                return "Your protein intake looks good! For balance, consider adding some complex carbs like brown rice or quinoa with vegetables.";
            }
            
        case 'workout':
            const goals = JSON.parse(localStorage.getItem('goalsData') || '{}');
            const goal = goals.specific || 'general fitness';
            
            if (goal === 'build muscle') {
                return "For muscle building, try: 3 sets of 8-12 reps for: Squats, Bench Press, Rows, and Overhead Press. Rest 60-90 seconds between sets.";
            } else if (goal === 'lose fat') {
                return "For fat loss, try this HIIT workout: 30 seconds work, 30 seconds rest for: Jumping Jacks, Mountain Climbers, High Knees, and Burpees. Repeat 4 times.";
            } else {
                return "For general fitness, try: 30 minutes of moderate cardio followed by bodyweight exercises: Push-ups, Squats, Planks, and Lunges.";
            }
            
        case 'protein':
            const targetProtein = 140; // This could be based on user weight
            const percentage = Math.round((totalProtein / targetProtein) * 100);
            
            if (percentage < 50) {
                return `You've consumed ${totalProtein}g protein (${percentage}% of target). You need ${targetProtein - totalProtein}g more. Focus on high-protein foods like chicken, fish, eggs, or protein shakes.`;
            } else if (percentage < 80) {
                return `Good progress! ${totalProtein}g protein (${percentage}% of target). You're on track. Consider a protein-rich snack to reach your goal.`;
            } else {
                return `Excellent! ${totalProtein}g protein (${percentage}% of target). You're meeting your protein needs for muscle recovery and growth.`;
            }
            
        default:
            return "I'm here to help with your fitness journey! Ask me about food, workouts, or protein intake.";
    }
}

function addMessage(text, sender) {
    const messages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// Data Management
function loadAllData() {
    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    // Load BMI data
    const bmiData = JSON.parse(localStorage.getItem('bmiData'));
    if (bmiData) {
        document.getElementById('height').value = bmiData.height;
        document.getElementById('weight').value = bmiData.weight;
        calculateBMI();
        
        if (bmiData.photo) {
            document.getElementById('bmi-preview').innerHTML = `<img src="${bmiData.photo}" alt="BMI Evidence">`;
        }
    }
    
    // Load goals
    const goalsData = JSON.parse(localStorage.getItem('goalsData'));
    if (goalsData) {
        document.getElementById('specific').value = goalsData.specific;
        document.getElementById('measurable').value = goalsData.measurable;
        document.getElementById('achievable').value = goalsData.achievable;
        document.getElementById('relevant').value = goalsData.relevant;
        document.getElementById('frequency').value = goalsData.fitt.frequency;
        document.getElementById('intensity').value = goalsData.fitt.intensity;
        document.getElementById('time').value = goalsData.fitt.time;
        
        // Check exercise types
        goalsData.fitt.type.forEach(type => {
            const checkbox = document.querySelector(`#exercise-types input[value="${type}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        updateGoal();
    }
}

// Export data function (bonus feature)
function exportData() {
    const allData = {
        bmi: JSON.parse(localStorage.getItem('bmiData')),
        goals: JSON.parse(localStorage.getItem('goalsData')),
        activities: JSON.parse(localStorage.getItem('activities')),
        foodLog: JSON.parse(localStorage.getItem('foodLog')),
        gallery: JSON.parse(localStorage.getItem('gallery')),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `28fit-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}
