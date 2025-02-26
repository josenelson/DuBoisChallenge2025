import React, { useRef, useEffect, useState } from 'react';
import { 
    scaleLinear, 
    line, 
    extent, 
    select,
    curveNatural,
    format
} from 'd3';
import { getSource04 } from '../util/data';
import Background from '../components/Background';
import { ensureElement, dollarValueFormatter } from '../util/d3util';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "WIP \nVisualization"; //"Acres of \nland \nowned by \nBlack \nGeorgians \n1970-1900";

const events = [
    {
        title: 'Klu-Kluxism',
        year: 1872,
        duration: 0
    },
    {
        title: 'Political unrest',
        year: 1875,
        duration: 5
    },
    {
        title: 'Rise of the new industrialism',
        year: 1880,
        duration: 10
    },
    {
        title: 'Lynching',
        year: 1890,
        duration: 5
    },
    {
        title: 'Finantial panic',
        year: 1894,
        duration: 0
    },
    {
        title: 'Disfranchisment and proscriptive laws',
        year: 1894,
        duration: 6
    }
];

const definedDataRange = [1875, 1899];

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

const shouldShowXValue = value => value % 5 === 0;

const shouldShowYValue = value => value % 1000000 === 0;

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
    const path = line(d => xScale(year(d)), d => yScale(value(d))).curve(curveNatural);

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

    // Defs
    const defsSelection = ensureElement({
        parent: container,
        elementType: 'defs',
        className: 'defs'
    });
    
    // Clip rectangle for defined area in chat
    const clipPathContainer = ensureElement({
        parent: defsSelection,
        elementType: 'clipPath',
        className: 'clip-path-container'
    }).attr('id', 'defined-selection');

    const clipPath = ensureElement({
        parent: clipPathContainer,
        elementType: 'rect',
        className: 'clip-path'
    }).attr('x', xScale(definedDataRange[0]))
      .attr('y', 0)
      .attr('width', xScale(definedDataRange[1]) - xScale(definedDataRange[0]))
      .attr('height', yScale.range()[0]);

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
                  .attr('x1', d => {
                    if (shouldShowYValue(d)) {
                        return margins.left;
                    }
                    return xRange[0];
                  })
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

    // Text for the xAxis
    const xAxisTextSelection = container.selectAll('text.x-axis').data(xTicks.filter(shouldShowXValue));

    xAxisTextSelection.enter()
                      .append('text')
                      .classed('x-axis', true)
                      .merge(xAxisTextSelection)
                      .attr('text-anchor', 'middle')
                      .attr('alignment-baseline', 'hanging')
                      .attr('font-family', 'Charter')
                      .attr('font-weight', 'bold')
                      .attr('fill-opacity', 0.9)
                      .attr('font-size', 11)
                      .attr('x', xScale)
                      .attr('y', yScale(yTicks[0]) + 3)
                      .text(d => d);

    // Text for the yAxis
    const visibileYTicks = yTicks.filter(shouldShowYValue);
    const yAxisTextSelection = container.selectAll('text.y-axis').data(visibileYTicks);

    yAxisTextSelection.enter()
                      .append('text')
                      .classed('y-axis', true)
                      .merge(yAxisTextSelection)
                      .attr('text-anchor', 'start')
                      .attr('alignment-baseline', 'top')
                      .attr('font-family', 'Charter')
                      .attr('font-weight', 'bold')
                      .attr('fill-opacity', 0.9)
                      .attr('font-size', 14)
                      .attr('x', margins.left)
                      .attr('y', yScale)
                      .attr('dy', '-0.3em')
                      .text((d, i) => {
                            if (i === visibileYTicks.length - 1) {
                                return `${d} dollars`;
                            }
                            return d;
                      });

    // Text for events
    const eventsSelection = container.selectAll('text.events').data(events);

    eventsSelection.enter()
                   .append('text')
                   .classed('events', true)
                   .merge(eventsSelection)
                   .attr('text-anchor', d => {
                        if (d.duration == 0) {
                            return 'end';
                        }
                        return 'middle';
                    })
                   .attr('dx', d => {
                        if (d.duration == 0) {
                            return '-2em';
                        }

                        return 0;
                   })
                   .attr('alignment-baseline', 'middle')
                   .attr('font-family', 'Charter')
                   .attr('font-weight', 'thin')
                   .attr('fill-opacity', 0.9)
                   .attr('font-size', 14)
                   .attr('transform', d => {
                        const midX = Math.floor((d.year + (d.year + d.duration)) / 2);
                        const x = xScale(midX);

                        let [yearData] = data.filter(d => d.year == midX);
                        if (!yearData) return;

                        const y = yScale(yearData.value);

                        if (d.duration == 0) {
                            return `translate(${x}, ${y}) rotate(-90)`;
                        }

                        return `translate(${x}, ${y})`;
                   })
                   .text(d => d.title.toLocaleUpperCase());

    // Main line (this has the be the last thing on the view hirarchy so it stays above everything else)
    const undefinedLineSelection = container.selectAll('path.mark-undefined').data([data]);

    undefinedLineSelection.enter()
                          .append('path')
                          .classed('mark-undefined', true)
                          .merge(undefinedLineSelection)
                          .attr('d', path)
                          .attr('stroke', 'red')
                          .attr('fill', 'none')
                          .attr('stroke-dasharray', '4 2')
                          .attr('stroke-width', 4);

    const lineSelection = container.selectAll('path.mark-defined').data([data]);

    lineSelection.enter()
                 .append('path')
                 .classed('mark-defined', true)
                 .merge(lineSelection)
                 .attr('d', path)
                 .attr('stroke', 'black')
                 .attr('fill', 'none')
                 .attr('stroke-width', 4)
                 .attr('clip-path', 'url(#defined-selection)');
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