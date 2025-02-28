import React, { useRef, useEffect, useState } from 'react';
import { 
    scaleLinear, 
    line, 
    extent, 
    select,
    curveNatural,
    min,
    max
} from 'd3';
import { getSource04 } from '../util/data';
import Background from '../components/Background';
import { ensureElement } from '../util/d3util';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "Valuation of Town and City Property owned by Black Georgians";

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
    const yLabelsMargin = 150;
    const leftMargin = margins.left + yLabelsMargin;
    
    const xRange = [leftMargin, size.width - margins.right];

    return xRange;
}

const getYRange = (size) => {
    const titleTextElement = window.document.querySelector('#titleText');
    const titleTextElementBox = titleTextElement.getBBox();

    const topMargin = titleTextElementBox.y + titleTextElementBox.height + margins.top  ;

    return [topMargin, size.height - (margins.bottom)];
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

    ensureElement({
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
                  .attr('stroke-opacity', 0.2)
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
                  .attr('stroke-opacity',d => {
                        if (shouldShowYValue(d)) {
                            return 0.6;
                        }
                        return 0.2;
                  })
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
                      .attr('stroke-width', 1)
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
                      .attr('fill-opacity', 0.7)
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

    let eventsSelection = container.selectAll('text.events').data(events);

    eventsSelection = eventsSelection.enter()
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
                                    .attr('fill-opacity', 0.7)
                                    .attr('font-size', 14)
                                    .attr('transform', d => {
                                            const startYear = d.year;
                                            const endYear = d.year + d.duration;
                                            const midYear = Math.floor((startYear + endYear) / 2);
                                            const x = xScale(midYear);

                                            const [midYearData] = data.filter(d => d.year == midYear);
                                            const [startYearData] = data.filter(d => d.year == startYear);
                                            const [endYearData] = data.filter(d => d.year == endYear);

                                            if (!midYearData || !startYearData || !endYearData) return;

                                            let y = yScale(midYearData.value);
                                            const startY = yScale(startYearData.value);
                                            const endY = yScale(endYearData.value);

                                            if (d.duration == 0) {
                                                return `translate(${x}, ${y}) rotate(-90)`;
                                            } else { 
                                                // Need to find the highest value of y and place the text bellow it
                                                y = max([y, startY, endY]);
                                                y += 10;
                                            }

                                            return `translate(${x}, ${y})`;
                                    })
                                    .text(d => {
                                        if (d.duration === 0) {
                                            return d.title.toLocaleUpperCase();
                                        }

                                        return '';
                                    });

    // Need to add the tspan(s) for the individual words
    eventsSelection.selectAll('span.line')
                   .data(d => {
                        if (d.duration > 0) {
                            return d.title.split(' ');
                        }
                        return [];
                   })
                   .join(
                        enter => enter.append('tspan').classed('line', true)
                   )
                   .attr('x', '0')
                   .attr('dy', '1em')
                   .text(d => d.toLocaleUpperCase());


    // Main line (this has the be the last thing on the view hirarchy so it stays above everything else)
    const undefinedLineSelection = container.selectAll('path.mark-undefined').data([data]);

    undefinedLineSelection.enter()
                          .append('path')
                          .classed('mark-undefined', true)
                          .merge(undefinedLineSelection)
                          .attr('d', path)
                          .attr('stroke', '#5F584E')
                          .attr('fill', 'none')
                          .attr('stroke-dasharray', '4 4')
                          .attr('stroke-opacity', '0.6')
                          .attr('stroke-width', 4);

    const lineSelection = container.selectAll('path.mark-defined').data([data]);

    lineSelection.enter()
                 .append('path')
                 .classed('mark-defined', true)
                 .merge(lineSelection)
                 .attr('d', path)
                 .attr('stroke', '#5F584E')
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