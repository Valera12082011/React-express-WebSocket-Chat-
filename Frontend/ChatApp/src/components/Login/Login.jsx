import React, { useState } from 'react';
import styles from "./Login.module.css"
import Cookies from 'js-cookie';

function Registration() {
    const [formData, setFormData] = useState({
        name: '',
        password: ''
    });
    const [message, setMessage] = useState('');

    // Обработчик изменений в форме
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            Cookies.set(
                "user_id",
                result.id,
            )
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className={styles.Registration}>
            <h2 className={styles.Title}>Login</h2>
            <form className={styles.Form} onSubmit={handleSubmit}>
                <div className={styles.FormElement}>
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className={styles.FormElement}>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button className={styles.SubMit} type="submit">Register</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Registration;
