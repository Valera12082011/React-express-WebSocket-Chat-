const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { Server } = require('ws');
const http = require('http');
const app = express();
const port = 3000;
const db = new sqlite3.Database('DB1.db');
const { v4: uuidv4 } = require('uuid'); // Импортируем uuid

// Инициализация схемы базы данных
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS user (
            id TEXT PRIMARY KEY,
            name TEXT,
            password TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS msg (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            msg TEXT,
            user_id TEXT,
            time_send TEXT,
            likes INT DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES user (id)
        )
    `);
});

// Middleware для CORS
app.use(cors());

// Middleware для парсинга JSON
app.use(express.json());

// Добавление пользователя
app.post('/users', (req, res) => {
    const { name, password } = req.body;
    const id = uuidv4(); // Генерация уникального идентификатора
    db.run('INSERT INTO user (id, name, password) VALUES (?, ?, ?)', [id, name, password], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: id });
    });
});

app.post("/login", (req, res) => {
    const { name, password } = req.body;

    db.get('SELECT * FROM user WHERE name = ? AND password = ?', [name, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ id: row.id }); // Змінили статус на 200, оскільки запит був успішний
    });
});

// Обновление информации о пользователе
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, password } = req.body;
    db.run('UPDATE user SET name = ?, password = ? WHERE id = ?', [name, password, id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    });
});

// Удаление пользователя
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM user WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// Добавление сообщения
app.post('/messages', (req, res) => {
    const { msg, user_id, time_send } = req.body;
    db.run('INSERT INTO msg (msg, user_id, time_send) VALUES (?, ?, ?)', [msg, user_id, time_send], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const messageId = this.lastID;
        // Отправка нового сообщения всем подключенным клиентам
        broadcast({
            type: 'NEW_MESSAGE',
            message: { id: messageId, msg, user_id, time_send, likes: 0 }
        });
        res.status(201).json({ id: messageId });
    });
});

// Обновление сообщения
app.put('/messages/:id', (req, res) => {
    const { id } = req.params;
    const { msg, time_send } = req.body;
    db.run('UPDATE msg SET msg = ?, time_send = ? WHERE id = ?', [msg, time_send, id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        // Отправка обновленного сообщения всем подключенным клиентам
        broadcast({
            type: 'UPDATE_MESSAGE',
            message: { id, msg, time_send }
        });
        res.json({ message: 'Message updated successfully' });
    });
});

// Получение всех сообщений
app.get('/messages_all', (req, res) => {
    db.all('SELECT * FROM msg', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Управление лайками
app.patch('/messages/:id/likes', (req, res) => {
    const { id } = req.params;
    const { increment } = req.body; // increment should be true or false
    if (typeof increment !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    const query = increment ? 'UPDATE msg SET likes = likes + 1 WHERE id = ?' : 'UPDATE msg SET likes = likes - 1 WHERE id = ?';
    db.run(query, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        // Отправка обновленных лайков всем подключенным клиентам
        broadcast({
            type: 'UPDATE_LIKES',
            message: { id, increment }
        });
        res.json({ message: 'Likes updated successfully' });
    });
});

// Удаление сообщения
app.delete('/messages/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM msg WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        // Удаление сообщения из всех подключенных клиентов
        broadcast({
            type: 'DELETE_MESSAGE',
            message: { id }
        });
        res.json({ message: 'Message deleted successfully' });
    });
});

// Создание HTTP сервера и WebSocket сервера
const server = http.createServer(app);
const wss = new Server({ server });

// Функция для рассылки сообщений всем подключенным клиентам
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Обработка подключений WebSocket
wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', message => {
        console.log('Received:', message);
        // Здесь можно обработать сообщения от клиентов, если нужно
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Запуск сервера
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
