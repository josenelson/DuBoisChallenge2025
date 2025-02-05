import React from 'react';
import reactDom from 'react-dom';
import {createRoot} from 'react-dom/client';
import App from './src/App';
import '././styles/main.scss';

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);