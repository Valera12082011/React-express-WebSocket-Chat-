import React from 'react'
import styles from './NotFound.module.css'
import Img from '../../static/NotFound.png'; // імпортуємо зображення

function NotFound() {
    return (
        <div className={styles.NotFound}>
            <img src={Img}></img>
            <p>Sorry but this page is not Found</p>
        </div>
    )
}

export default NotFound
