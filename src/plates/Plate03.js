import React, { useRef, useEffect, useState } from 'react';
import { scaleLinear, scaleBand, extent, select, easeCubic, format, json, geoMercator, geoPath } from 'd3';
import { getSource03 } from '../util/data';
import Background from '../components/Background';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "Acres of \nland \nowned by \nBlack \nGeorgians";

const TitleTextStyle = {
    font: "2em 'B52-ULC W00 ULC'"
};

const maxBarWidth = 800;

const xLabelSize = 40;

const animationDelay = 150;

const getYRange = (size) => {
    return [margins.top, size.height - (margins.bottom)];
}

const getXRange = (size) => {
    const titleTextElement = window.document.querySelector('#titleText');
    const titleTextElementBox = titleTextElement.getBBox();
    const leftMargin = titleTextElementBox.x + titleTextElementBox.width;

    const xRange = [leftMargin + margins.left, size.width - margins.right - xLabelSize];

    if (xRange[1] - xRange[0] > maxBarWidth) {
        xRange[1] = xRange[0] + maxBarWidth;
    }

    return xRange;
}

const Visualization = ({
    element, 
    size,
    data,
    geoData
}) => {
    if (data.length == 0) return;
    if (!geoData) return;

    const valueRange = extent(data, d => d.value);
    const yRange = getYRange(size);
    const xRange = getXRange(size);

    const projection = geoMercator().fitSize([400, 400], geoData);
    const path = geoPath().projection(projection);

    const shapeSelection = select(element).selectAll('path.mark').data(geoData.features);

    shapeSelection.enter()
                  .append('path')
                  .attr('d', path)
                  .attr('stroke', 'black');
};

const Chart = ({
    size
}) => {
    const containerRef = useRef(null);
    const [data, setData] = useState([]);
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        getSource03().then(data => {
            const sortedData = data.sort((a, b) => a.year - b.year)
            setData(sortedData)
        });
    }, []);

    useEffect(() => {
        json('./plate03/data.json').then(geoData => {
            setGeoData(geoData);
        });
    }, []);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        Visualization({
            element: containerRef.current, 
            data: data, 
            geoData: geoData,
            size: size
        });
    }, [data, size]);

    return (
        <svg className='plate'>
            <defs>
                <filter x="-4.0%" y="-13.9%" width="108.0%" height="127.9%" filterUnits="objectBoundingBox" id="filter-g9odhc_gqf-2">
                    <feMorphology radius="5" operator="erode" in="SourceAlpha" result="shadowSpreadInner1"></feMorphology>
                    <feGaussianBlur stdDeviation="5" in="shadowSpreadInner1" result="shadowBlurInner1"></feGaussianBlur>
                    <feOffset dx="1" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
                    <feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"></feComposite>
                    <feColorMatrix values="0 0 0 0 0.396078431   0 0 0 0 0.262745098   0 0 0 0 0.129411765  0 0 0 0.703261582 0" type="matrix" in="shadowInnerInner1"></feColorMatrix>
                </filter>
            </defs>
            <g>
                <Background />
                <text 
                    id="titleText"
                    style={TitleTextStyle}
                    opacity="0.7"
                    x={margins.left} 
                    y={margins.top}>
                    {titleText.split('\n').map((text, i) => (
                        <tspan x={margins.left} dy="1.2em" key={i}>{text.toLocaleUpperCase()}</tspan>
                    ))}
                </text>
                <g ref={containerRef} />
            </g>
        </svg>
    );
}

export default Chart;