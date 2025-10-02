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
  };
  console.log("Submitting task:", task);
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  loadTasks();
});

async function loadTasks() {
  const res = await fetch(API_URL);
  const tasks = await res.json();
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.title} (${task.priority}) - ${task.category}`;
    taskList.appendChild(li);
  });
}

loadTasks();
