const form = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const task = {
    title: document.getElementById('title').value,
    dueDate: document.getElementById('dueDate').value,
    priority: document.getElementById('priority').value,
    category: document.getElementById('category').value,
  };
  await fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  loadTasks();
});

async function loadTasks() {
  const res = await fetch('http://localhost:3000/tasks');
  const tasks = await res.json();
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.title} (${task.priority}) - ${task.category}`;
    taskList.appendChild(li);
  });
}

loadTasks();
