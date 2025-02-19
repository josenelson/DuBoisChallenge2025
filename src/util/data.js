import { csv, json } from 'd3';

const getSource01 = async function() {
    const data = await csv("/data01.csv");

    const transformedData = data.map(d => {
        return {
            year: d.Year * 1,
            value: d["Land Value (Dollars)"] * 1
        }
    });

    return transformedData;
}

const getSource02 = async function() {
    const data = await csv("/data02.csv");

    const transformedData = data.map(d => {
        return {
            year: d.Date * 1,
            value: d.Land * 1
        }
    });

    return transformedData;
}

const getSource03 = async function() {
    const data = await csv("/data03.csv");

    const transformedData = data.map(d => {
        return {
            county: d['County1890'],
            acres: d['Acres 1899']
        }
    });

    return transformedData;
}

const getShape03 = async function() {
    const shapeData = await json('/data03.geo.json');

    return shapeData;
}

const getCountyData03 = async function() {
    let countyData = await csv('/data03.counties.csv');

    countyData = countyData.map(d => {
        return {
            county: d['County1890'],
            blackPopulation: (d['Black population 1890'] || 0) * 1
        };
    });

    return countyData;
}

export { getSource01, getSource02, getSource03, getShape03, getCountyData03 };