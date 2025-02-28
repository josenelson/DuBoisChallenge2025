import React, {useEffect, useState} from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import withContainer from "./components/ContainerWrapper";
import Plate01 from './plates/Plate01';
import Plate02 from './plates/Plate02';
import Plate03 from './plates/Plate03';
import Plate04 from './plates/Plate04';
import Plate05 from './plates/Plate05';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route index path="/plate01?" element={withContainer(<Plate01 />)} />
                <Route path="/plate02" element={withContainer(<Plate02 />)} />
                <Route path="/plate03" element={withContainer(<Plate03 />)} />
                <Route path="/plate04" element={withContainer(<Plate04 />)} />
                <Route path="/plate05" element={withContainer(<Plate05 />)} />
            </Routes>
        </BrowserRouter>
    );

}

export default App;