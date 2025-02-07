import React, {useEffect, useState} from "react";
import Container from "./components/Container";
import Plate01 from './plates/Plate01';
import { getSource01 } from './util/data';

const App = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        getSource01().then(setData);
    }, []);
    
    return (
        <Container>
            <Plate01 data={data} />
        </Container>
    );

}

export default App;