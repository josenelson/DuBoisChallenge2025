import React, {useEffect, useState} from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import withContainer from "./components/ContainerWrapper";
import Plate01 from './plates/Plate01';
import { getSource01 } from './util/data';

const App = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        getSource01().then(setData);
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route index path="/" element={withContainer(<Plate01 data={data} />)} />
            </Routes>
        </BrowserRouter>
    );

}

export default App;