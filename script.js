const firebaseConfig = {
  apiKey: "AIzaSyB_vcRRtPynj_W_qGBoLVmbr7O-MZgxQGQ",
  authDomain: "taskmanager-9af8f.firebaseapp.com",
  projectId: "taskmanager-9af8f",
  storageBucket: "taskmanager-9af8f.firebasestorage.app",
  messagingSenderId: "224989554121",
  appId: "1:224989554121:web:cf4e4c07c9176632ed7418",
  measurementId: "G-6ME9NF70LE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const form = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const API_URL = "https://task-manager-backend-71o4.onrender.com/tasks";

document.getElementById('loginGoogle').addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
});

document.getElementById('logout').addEventListener('click', () => {
  auth.signOut();
});

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('authStatus').textContent = `Signed in as ${user.displayName}`;
    form.style.display = 'block';
    document.getElementById('logout').style.display = 'inline-block';
    document.getElementById('loginGoogle').style.display = 'none';
    document.getElementById('calendar').style.display = 'block';
    loadTasks();
  } else {
    document.getElementById('authStatus').textContent = 'Not signed in';
    form.style.display = 'none';
    taskList.innerHTML = '';
    document.getElementById('logout').style.display = 'none';
    document.getElementById('loginGoogle').style.display = 'inline-block';
    document.getElementById('calendar').style.display = 'none';
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const task = {
    title: document.getElementById('title').value,
    dueDate: document.getElementById('dueDate').value,
    priority: document.getElementById('priority').value,
    category: document.getElementById('category').value,
    description: document.getElementById('description').value,
    userId: user.uid
  };
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  form.reset();
  loadTasks();
});

async function loadTasks() {
  const user = auth.currentUser;
  if (!user) return;

  const res = await fetch(API_URL);
  const allTasks = await res.json();
  const tasks = allTasks.filter(t => t.userId === user.uid);
  tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  document.getElementById('totalCount').textContent = totalCount;
  document.getElementById('completedCount').textContent = completedCount;
  document.getElementById('pendingCount').textContent = pendingCount;

  const progressBar = document.getElementById('progressBar');
  progressBar.style.width = `${progressPercent}%`;
  progressBar.textContent = `${progressPercent}%`;

  const categoryFilter = document.getElementById('filterCategory').value;
  const priorityFilter = document.getElementById('filterPriority').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();

  const filteredTasks = tasks.filter(task => {
    const matchCategory = categoryFilter ? task.category === categoryFilter : true;
    const matchPriority = priorityFilter ? task.priority === priorityFilter : true;
    const matchStatus = statusFilter
      ? statusFilter === "Completed"
        ? task.completed
        : !task.completed
      : true;
    return matchCategory && matchPriority && matchStatus;
  });

  const searchedTasks = filteredTasks.filter(task => {
    const inTitle = task.title.toLowerCase().includes(searchQuery);
    const inDescription = task.description.toLowerCase().includes(searchQuery);
    return inTitle || inDescription;
  });

  taskList.innerHTML = '';

  searchedTasks.forEach(task => {
    const li = document.createElement('li');
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

    const info = document.createElement('div');
    info.innerHTML = `<strong>${task.title}</strong> (${task.priority}) - ${task.category} <br><small>Due: ${task.dueDate}</small> <br><em>${task.description}</em>`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.classList.add("form-check-input", "me-2");
    checkbox.onclick = async () => {
      await fetch(`${API_URL}/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: checkbox.checked })
      });
      loadTasks();
    };

    if (task.completed) {
      info.style.textDecoration = "line-through";
      info.style.opacity = "0.6";
    }

    const taskContent = document.createElement('div');
    taskContent.classList.add("d-flex", "align-items-center");
    taskContent.appendChild(checkbox);
    taskContent.appendChild(info);

    const editBtn = document.createElement('button');
    editBtn.innerHTML = `<i class="bi bi-pencil-square"></i> Edit`;
    editBtn.classList.add("btn", "btn-warning", "btn-sm", "me-2");
    editBtn.onclick = async () => {
      const newTitle = prompt("Edit task title:", task.title);
      const newDueDate = prompt("Edit due date:", task.dueDate);
      const newPriority = prompt("Edit priority:", task.priority);
      const newCategory = prompt("Edit category:", task.category);
      const newDescription = prompt("Edit description/reminder:", task.description);

      if (newTitle && newDueDate && newPriority && newCategory) {
        await fetch(`${API_URL}/${task._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            dueDate: newDueDate,
            priority: newPriority,
            category: newCategory,
            description: newDescription
          })
        });
        loadTasks();
      }
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = `<i class="bi bi-trash"></i> Delete`;
    deleteBtn.classList.add("btn", "btn-danger", "btn-sm");
    deleteBtn.onclick = async () => {
      await fetch(`${API_URL}/${task._id}`, { method: 'DELETE' });
      loadTasks();
    };

    const controls = document.createElement('div');
    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(taskContent);
    li.appendChild(controls);
    taskList.appendChild(li);
  });

  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = '';

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 500,
    events: searchedTasks.map(task => ({
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
          }).then(loadTasks);
        }
      } else {
        const confirmDelete = confirm("Are you sure you want to delete this task?");
        if (confirmDelete) {
          fetch(`${API_URL}/${taskId}`, {
            method: 'DELETE'
          }).then(loadTasks);
        }
      }
    }
  });
  calendar.render();
}

document.getElementById('darkModeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

document.getElementById('filterCategory').addEventListener('change', loadTasks);
document.getElementById('filterPriority').addEventListener('change', loadTasks);
document.getElementById('filterStatus').addEventListener('change', loadTasks);
document.getElementById('searchInput').addEventListener('input', loadTasks);

document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterPriority').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('searchInput').value = '';
  loadTasks();
});

loadTasks();
