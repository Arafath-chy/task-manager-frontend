// 🔐 Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyB_vcRRtPynj_W_qGBoLVmbr7O-MZgxQGQ",
  authDomain: "taskmanager-9af8f.firebaseapp.com",
  projectId: "taskmanager-9af8f",
  storageBucket: "taskmanager-9af8f.appspot.com",
  messagingSenderId: "224989554121",
  appId: "1:224989554121:web:cf4e4c07c9176632ed7418",
  measurementId: "G-6ME9NF70LE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const API_URL = "https://task-manager-backend-71o4.onrender.com/tasks";

const form = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const progressBar = document.getElementById('progressBar');
let calendar; // global calendar instance

// 🔁 Auth Flow
document.getElementById('loginGoogle').onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

document.getElementById('logout').onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('authStatus').textContent = `Signed in as ${user.displayName}`;
    document.getElementById('loginGoogle').style.display = 'none';
    document.getElementById('logout').style.display = 'inline-block';
    document.getElementById('calendar').style.display = 'block';
    form.style.display = 'block';
    loadTasks(user);
  } else {
    document.getElementById('authStatus').textContent = 'Not signed in';
    document.getElementById('loginGoogle').style.display = 'inline-block';
    document.getElementById('logout').style.display = 'none';
    document.getElementById('calendar').style.display = 'none';
    taskList.innerHTML = '';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
  }
});

// 📝 Add Task
form.onsubmit = async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const task = {
    title: title.value,
    dueDate: dueDate.value,
    priority: priority.value,
    category: category.value,
    description: description.value,
    completed: false,
    userId: user.uid
  };

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });

  form.reset();
  loadTasks(user);
};

// 📦 Load and Render Tasks
async function loadTasks(user) {
  const res = await fetch(`${API_URL}?userId=${user.uid}`);
  const allTasks = await res.json();
  const tasks = allTasks.map(t => ({ ...t, completed: !!t.completed }));

  // 🔍 Apply Filters
  const categoryFilter = filterCategory.value;
  const priorityFilter = filterPriority.value;
  const statusFilter = filterStatus.value;
  const searchQuery = searchInput.value.toLowerCase();

  const filtered = tasks.filter(task => {
    const matchCategory = categoryFilter ? task.category === categoryFilter : true;
    const matchPriority = priorityFilter ? task.priority === priorityFilter : true;
    const matchStatus = statusFilter
      ? statusFilter === "Completed" ? task.completed : !task.completed
      : true;
    const matchSearch = task.title.toLowerCase().includes(searchQuery) ||
                        task.description.toLowerCase().includes(searchQuery);
    return matchCategory && matchPriority && matchStatus && matchSearch;
  });

  // 📊 Progress Summary
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  totalCount.textContent = total;
  completedCount.textContent = completed;
  pendingCount.textContent = total - completed;
  progressBar.style.width = `${percent}%`;
  progressBar.textContent = `${percent}%`;

  // 📋 Task List
  taskList.innerHTML = '';
  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    const info = document.createElement('div');
    info.innerHTML = `<strong>${task.title}</strong> (${task.priority}) - ${task.category}
      <br><small>Due: ${task.dueDate}</small><br><em>${task.description}</em>`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = "form-check-input me-2";
    checkbox.onclick = async () => {
      await fetch(`${API_URL}/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: checkbox.checked })
      });
      loadTasks(user);
    };

    if (task.completed) {
      info.style.textDecoration = "line-through";
      info.style.opacity = "0.6";
    }

    const taskContent = document.createElement('div');
    taskContent.className = "d-flex align-items-center";
    taskContent.appendChild(checkbox);
    taskContent.appendChild(info);

    const editBtn = document.createElement('button');
    editBtn.className = "btn btn-warning btn-sm me-2";
    editBtn.innerHTML = `<i class="bi bi-pencil-square"></i> Edit`;
    editBtn.onclick = () => editTask(task);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.innerHTML = `<i class="bi bi-trash"></i> Delete`;
    deleteBtn.onclick = async () => {
      await fetch(`${API_URL}/${task._id}`, { method: 'DELETE' });
      loadTasks(user);
    };

    const controls = document.createElement('div');
    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(taskContent);
    li.appendChild(controls);
    taskList.appendChild(li);
  });

  // 📅 Calendar
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  if (calendar) calendar.destroy();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 500,
    events: tasks
      .filter(task => task.dueDate)
      .map(task => ({
        title: task.title,
        start: task.dueDate,
        description: task.description,
        _id: task._id
      })),
    eventClick: function(info) {
      const taskId = info.event.extendedProps._id;
      const taskTitle = info.event.title;
      const taskDesc = info.event.extendedProps.description;
      const taskDate = info.event.startStr;

      const action = confirm(`${taskTitle}\n\n${taskDesc}\n\nClick OK to edit, Cancel to delete.`);
      if (action) {
        const newTitle = prompt("Edit task title:", taskTitle);
        const newDescription = prompt("Edit description:", taskDesc);
        const newDate = prompt("Edit due date (YYYY-MM-DD):", taskDate);

        if (newTitle && newDate) {
          fetch(`${API_URL}/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: newTitle,
              description: newDescription,
              dueDate: newDate
            })
          }).then(() => loadTasks(user));
        }
      } else {
        const confirmDelete = confirm("Are you sure you want to delete this task?");
        if (confirmDelete) {
          fetch(`${API_URL}/${taskId}`, {
            method: 'DELETE'
          }).then(() => loadTasks(user));
        }
      }
    }
  });

  calendar.render();
}

// ✏️ Edit Task (from list)
function editTask(task) {
  const newTitle = prompt("Edit task title:", task.title);
  const newDueDate = prompt("Edit due date:", task.dueDate);
  const newPriority = prompt("Edit priority:", task.priority);
  const newCategory = prompt("Edit category:", task.category);
  const newDescription = prompt("Edit description:", task.description);

  if (newTitle && newDueDate && newPriority && newCategory) {
    fetch(`${API_URL}/${task._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        dueDate: newDueDate,
        priority: newPriority,
        category: newCategory,
        description: newDescription
      })
    }).then(() => loadTasks(auth.currentUser));
  }
}

// 🌙 Dark Mode
darkModeToggle.onclick = () => {
  document.body.classList.toggle('dark-mode');
};

// 🔍 Filters & Search
filterCategory.onchange = () => loadTasks(auth.currentUser);
filterPriority.onchange = () => loadTasks(auth.currentUser);
filterStatus.onchange = () => loadTasks(auth.currentUser);
searchInput.oninput = () => loadTasks(auth.currentUser);

clearFilters.onclick = () => {
  filterCategory.value = '';
  filterPriority.value = '';
  filterStatus.value = '';
  searchInput.value = '';
  loadTasks(auth.currentUser);
};
