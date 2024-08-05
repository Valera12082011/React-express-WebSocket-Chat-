import React, { useEffect, useState } from 'react';
import styles from './ChaList.module.css'
import Cookies from "js-cookie";

function ChatList() {
    const [data, setData] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [likedMessages, setLikedMessages] = useState(new Set()); // Храним лайкнутые сообщения

    useEffect(() => {
        // Инициализация WebSocket
        const ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'NEW_MESSAGE') {
                setData(prevData => [...prevData, message.message]);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };

        // Fetch initial messages
        async function getAllMessages() {
            try {
                const response = await fetch('http://localhost:3000/messages_all');
                if (response.ok) {
                    const jsonData = await response.json();
                    setData(jsonData);
                } else {
                    console.error('Failed to fetch messages:', response.statusText);
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
            }
        }

        getAllMessages();

        // Cleanup on component unmount
        return () => {
            ws.close();
        };
    }, []);

    const handleLike = async (id) => {
        const isLiked = likedMessages.has(id);

        try {
            const response = await fetch(`http://localhost:3000/messages/${id}/likes`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ increment: !isLiked }), // Toggle like
            });

            if (response.ok) {
                // Обновление состояния лайков
                setLikedMessages(prevLikedMessages => {
                    const newLikedMessages = new Set(prevLikedMessages);
                    if (isLiked) {
                        newLikedMessages.delete(id);
                    } else {
                        newLikedMessages.add(id);
                    }
                    return newLikedMessages;
                });

                // Обновление данных сообщений на клиенте
                setData(prevData =>
                    prevData.map(msg =>
                        msg.id === id
                            ? { ...msg, likes: msg.likes + (isLiked ? -1 : 1) }
                            : msg
                    )
                );
            } else {
                console.error('Failed to update likes:', response.statusText);
            }
        } catch (err) {
            console.error('Error updating likes:', err);
        }
    };

    const handleAddMessage = async () => {
        try {
            const response = await fetch('http://localhost:3000/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    msg: newMessage,
                    user_id: Cookies.get("user_id"), // Здесь замените на реальный ID пользователя
                    time_send: new Date().toISOString()
                }),
            });

            if (response.ok) {
                const newMessageData = await response.json();
                // После отправки сообщения, сервер WebSocket сам разошлет новое сообщение всем клиентам
                setNewMessage(''); // Очистка поля ввода
            } else {
                console.error('Failed to add message:', response.statusText);
            }
        } catch (err) {
            console.error('Error adding message:', err);
        }
    };

    return (
        <div>
            <br /><br /><br /><br />
            {data.length > 0 ? (
                data.map((message) => (
                    <div className={styles.AllMessages} key={message.id}>
                        <p>{message.msg}</p>
                        <p>Likes: {message.likes}</p>
                        <button
                            onClick={() => handleLike(message.id)}
                        >
                            {likedMessages.has(message.id) ? 'Unlike' : 'Like'}
                        </button>
                    </div>
                ))
            ) : (
                <div className={styles.NotFound}>Not Found</div>
            )}
            <div>
                <textarea
                    className={styles.Input}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                />
                <button className={styles.Send} onClick={handleAddMessage}>Send</button>
            </div>
        </div>
    );
}

export default ChatList;
