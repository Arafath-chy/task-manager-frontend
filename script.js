const form = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const API_URL = "https://task-manager-backend-71o4.onrender.com/tasks";

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const task = {
    title: document.getElementById('title').value,
    dueDate: document.getElementById('dueDate').value,
    priority: document.getElementById('priority').value,
    category: document.getElementById('category').value,
    description: document.getElementById('description').value
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
  const res = await fetch(API_URL);
  const tasks = await res.json();
  tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));  // ✅ Sort by date
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

    const info = document.createElement('div');
    info.innerHTML = `<strong>${task.title}</strong> (${task.priority}) - ${task.category} <br><small>Due: ${task.dueDate}</small> <br><em>${task.description}</em>`;

    // ✅ Checkbox for completion
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

    // ✅ Style completed tasks
    if (task.completed) {
      info.style.textDecoration = "line-through";
      info.style.opacity = "0.6";
    }

    // ✅ Combine checkbox and info
    const taskContent = document.createElement('div');
    taskContent.classList.add("d-flex", "align-items-center");
    taskContent.appendChild(checkbox);
    taskContent.appendChild(info);

    const controls = document.createElement('div');

    // ✅ Edit Button
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

    // ✅ Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = `<i class="bi bi-trash"></i> Delete`;
    deleteBtn.classList.add("btn", "btn-danger", "btn-sm");
    deleteBtn.onclick = async () => {
      await fetch(`${API_URL}/${task._id}`, { method: 'DELETE' });
      loadTasks();
    };

    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(taskContent);  // ✅ Replaces li.appendChild(info)
    li.appendChild(controls);
    taskList.appendChild(li);
  });

  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = ''; // Clear previous calendar if reloading

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 500,
    events: tasks.map(task => ({
      title: task.title,
      start: task.dueDate,
      description: task.description
    })),
    eventClick: function(info) {
      alert(`${info.event.title}\n${info.event.extendedProps.description}`);
    }
  });
  calendar.render();
}

const toggleBtn = document.getElementById('darkModeToggle');
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

loadTasks();
