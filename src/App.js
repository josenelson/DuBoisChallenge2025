import React, {useEffect, useState} from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import withContainer from "./components/ContainerWrapper";
import Plate01 from './plates/Plate01';
import Plate02 from './plates/Plate02';
import { getSource01 } from './util/data';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route index path="/plate01?" element={withContainer(<Plate01 />)} />
                <Route path="/plate02" element={withContainer(<Plate02 />)} />
            </Routes>
        </BrowserRouter>
    );

}

export default App;