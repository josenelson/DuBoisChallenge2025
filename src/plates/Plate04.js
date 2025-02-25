import React, { useRef, useEffect, useState } from 'react';
import { 
    scaleLinear, 
    line, 
    extent, 
    select
} from 'd3';
import { getSource04 } from '../util/data';
import Background from '../components/Background';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "WIP \nVisualization"; //"Acres of \nland \nowned by \nBlack \nGeorgians \n1970-1900";

const TitleTextStyle = {
    font: "2em 'B52-ULC W00 ULC'"
};


const getYRange = (size) => {
    return [margins.top, size.height - (margins.bottom)];
}

const getYTicks = yScale => {
    const [min, max] = yScale.domain();
    if (!(min < max)) return [];

    const increment = 100 * 1000;
    
    let start = 0;
    const ticks = [];

    while (start <= max) {
        ticks.push(start);
        start += increment;
    }

    return ticks;
}

const getXRange = (size) => {
    const titleTextElement = window.document.querySelector('#titleText');
    const titleTextElementBox = titleTextElement.getBBox();
    const leftMargin = titleTextElementBox.x + titleTextElementBox.width;

    const xRange = [leftMargin + margins.left, size.width - margins.right];

    return xRange;
}

const Visualization = ({
    element, 
    size,
    data
}) => {
    if (data.length == 0) return;

    // Data ranges
    const value = d => d.value;
    const year = d => d.year;
    
    const valueRange = extent(data, value);
    const yearRange = extent(data, year);

    const yRange = getYRange(size);
    const xRange = getXRange(size);
    
    // Scales
    const xScale = scaleLinear(yearRange, xRange);
    const yScale = scaleLinear([0, valueRange[1]], [yRange[1], yRange[0]]);

    let xTicks = data.map(d => d.year);
    let yTicks = getYTicks(yScale);

    // Line generator
    const linePath = line(d => xScale(year(d)), d => yScale(value(d)));

    // State
    let selectedIndex = -1;

    // Selections
    const parentSelection = select(element);

    let container = parentSelection.selectAll('g.container')
                                     .data([data])
                                     .join(
                                        enter => {
                                            const selection = enter.append('g')
                                                                   .classed('container', true);
                                            return selection;
                                        }
                                     );

    

    

    // X Axis
    const xAxisSelection = container.selectAll('line.x-axis').data(xTicks);

    xAxisSelection.enter()
                  .append('line')
                  .classed('x-axis', true)
                  .merge(xAxisSelection)
                  .attr('x1', xScale)
                  .attr('x2', xScale)
                  .attr('y1', yScale(yTicks[0]))
                  .attr('y2', yScale(yTicks[yTicks.length - 1]))
                  .attr('stroke-width', 1)
                  .attr('stroke', 'red');

    // Y Axis
    const yAxisSelection = container.selectAll('line.y-axis').data(yTicks);

    yAxisSelection.enter()
                  .append('line')
                  .classed('y-axis', true)
                  .merge(yAxisSelection)
                  .attr('y1', yScale)
                  .attr('y2', yScale)
                  .attr('x1', xRange[0])
                  .attr('x2', xRange[1])
                  .attr('stroke-width', 1)
                  .attr('stroke', 'red');
                
    // Bounding rectangle for axis
    const boundAxisSelection = container.selectAll('rect.axis-boundry').data([xTicks, yTicks]);

    boundAxisSelection.enter()
                      .append('rect')
                      .classed('axis-boundry', true)
                      .merge(boundAxisSelection)
                      .attr('x', xScale(xTicks[0]))
                      .attr('y', yScale(yTicks[yTicks.length - 1]))
                      .attr('width', xScale(xTicks[xTicks.length - 1]) - xScale(xTicks[0]))
                      .attr('height', yScale(yTicks[0]) - yScale(yTicks[yTicks.length - 1]))
                      .attr('fill', 'none')
                      .attr('stroke-width', 2)
                      .attr('stroke', 'black');

    // Main line (this has the be the last thing on the view hirarchy so it stays above everything else)
    const lineSelection = container.selectAll('path.mark').data([data]);

    lineSelection.enter()
                 .append('path')
                 .classed('mark', true)
                 .merge(lineSelection)
                 .attr('d', d => linePath(d))
                 .attr('stroke', 'black')
                 .attr('fill', 'none')
                 .attr('stroke-width', 4);
};

const Chart = ({
    size
}) => {
    const containerRef = useRef(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const data = await getSource04();
            
            setData(data);
        }

        fetchData();
    }, []);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        Visualization({
            element: containerRef.current, 
            data: data,
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