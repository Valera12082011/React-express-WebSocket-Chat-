import React from 'react';
import style from './NavBar.module.css';
import { GoHomeFill } from "react-icons/go";
import { IoChatbox } from "react-icons/io5";


function NavBar() {
    return (
        <div className={style.NavBar}>
            <ul className={style.RoutersItemsList}>
                <li onClick={() => document.location.href = '/chat'} className={style.RoutersItem}>
                    Chats
                    <IoChatbox className={style.Icon}></IoChatbox>
                </li>
            </ul>

            <div className={style.Auth}>
                <button onClick={() => document.location.href = '/login'} className={style.AuthIconLogin}>Login</button>
                <button onClick={() => document.location.href = '/registration'} className={style.AuthIconReg}>Sign Up</button>
            </div>
        </div>
    )
}

export default NavBar
