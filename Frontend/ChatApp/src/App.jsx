import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import NavBar from '../src/components/NavBar/NavBar.jsx';
import NotFound from "./components/NotFound/NotFound.jsx";
import Login from "./components/Login/Login.jsx";
import Registration from "./components/Registration/Registration.jsx";
import ChatList from "./components/ChatList/ChatList.jsx";
const App = () => {

    return (
        <Router>
            <NavBar></NavBar>
            <Routes>
                <Route path="/registration" element={<Registration />} />
                <Route path='/login' element={<Login />}></Route>
                <Route path='/login'></Route>
                <Route path="*" element={<NotFound />} />
                <Route path='/chat' element={<ChatList />} />
            </Routes>
        </Router>
    );
};

export default App;
