import { csv } from 'd3';

const getSource01 = async function() {
    const data = await csv("./data01.csv");

    const transformedData = data.map(d => {
        return {
            year: d.Year * 1,
            value: d["Land Value (Dollars)"] * 1
        }
    });

    return transformedData;
}

const getSource02 = async function() {
    const data = await csv("./data02.csv");

    const transformedData = data.map(d => {
        return {
            year: d.Date * 1,
            value: d.Land * 1
        }
    });

    return transformedData;
}

export { getSource01, getSource02 };