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
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

    const info = document.createElement('div');
    info.innerHTML = `<strong>${task.title}</strong> (${task.priority}) - ${task.category} <br><small>Due: ${task.dueDate}</small>`;

    const controls = document.createElement('div');

    // ✅ Edit Button
    const editBtn = document.createElement('button');
    editBtn.textContent = "Edit";
    editBtn.classList.add("btn", "btn-warning", "btn-sm", "me-2");
    editBtn.onclick = async () => {
      const newTitle = prompt("Edit task title:", task.title);
      const newDueDate = prompt("Edit due date:", task.dueDate);
      const newPriority = prompt("Edit priority:", task.priority);
      const newCategory = prompt("Edit category:", task.category);

      if (newTitle && newDueDate && newPriority && newCategory) {
        await fetch(`${API_URL}/${task._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            dueDate: newDueDate,
            priority: newPriority,
            category: newCategory
          })
        });
        loadTasks();
      }
    };

    // ✅ Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("btn", "btn-danger", "btn-sm");
    deleteBtn.onclick = async () => {
      await fetch(`${API_URL}/${task._id}`, { method: 'DELETE' });
      loadTasks();
    };

    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(info);
    li.appendChild(controls);
    taskList.appendChild(li);
  });
}

loadTasks();

