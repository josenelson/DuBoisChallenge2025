import React, { useRef, useEffect, useState } from 'react';
import { 
    scaleLinear,
    select,
    scaleOrdinal
} from 'd3';
import { getSource10 } from '../util/data';
import Background from '../components/Background';
import { rightArrow} from '../util/geometry';
import { ensureElement } from '../util/d3util';

const margins = {
    top: 10,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "WIP Visualization";

const TitleTextStyle = {
    font: "1.2em 'B52-ULC W00 ULC'"
}

const labelsSize = 165;

const rightLabelsSize = 50;

const barSize = 24;

const getXRange = (size) => {
    const leftMargin = margins.left;
    
    const xRange = [leftMargin, size.width - margins.right];

    return xRange;
}

const getYRange = (size) => {
    const titleTextElement = window.document.querySelector('#titleText');
    const titleTextElementBox = titleTextElement.getBBox();

    const topMargin = titleTextElementBox.y + titleTextElementBox.height + margins.top  ;

    return [topMargin, size.height - (margins.bottom)];
}

const categoryOrder = ['rent', 'food', 'clothes', 'tax', 'other'];

const classGroups = [
    {name: 'Poor', from: 0, to: 250},
    {name: 'Fair', from: 250, to: 500},
    {name: 'Comfortable', from: 500, to: 1000},
    {name: 'Well-Todo', from: 1000, to: 1000000}
];

const axisLabelsSize = 40;

const Visualization = ({
    element, 
    size,
    data
}) => {
    if (data.length == 0) return;

    // Getters
    const getClass = d => d.income_class;
    const getAverage = d => d.actual_average;
    const getCategories = d => d.categories;
    
    // Add the index to all the items
    data = data.map((d, i) => {
        d.index = i;
        return d;
    });

    // Add the categories as an array and the accumulated value
    data = data.map((d, i) => {
        let accumulated = 0;

        d.categories = categoryOrder.map(category => {
            const cat = {
                name: category,
                value: d[category],
                original_index: i,
                acc: accumulated
            };

            accumulated += cat.value;

            return cat;
        });

        return d;
    });

    // Ranges
    const yRange = getYRange(size);
    const xRange = getXRange(size);
    const maxBarWidth = xRange[1] - xRange[0] - labelsSize - rightLabelsSize;
    const classGroupRanges = classGroups.map(d => {
        return {
            ...d,
            values: data.filter(value => value.actual_average >= d.from && value.actual_average < d.to)
        };
    });

    // Scales
    const xScale = scaleLinear([0, 100], [0, maxBarWidth]);
    const yScale = scaleLinear([0, data.length], [yRange[0] + axisLabelsSize, yRange[1]]);
    const colorRange = ['#000000', '#7e6583', '#ffc0cb', '#B1C0CC', '#d2b48c', '#d2b48c', '#7e6583' , '#00aa00', '#ffc0cb' , '#654321', '#000000'];
    const calculatedBarSize = barSize * 2;

    // Helper functions for positions
    const getBarXPosition = d => {
        const acc = d.acc;
        return xScale(acc) + labelsSize;
    }

    const getBarYPosition = d => {
        const originalIndex = d.original_index;
        return yScale(originalIndex);
    }

    const getBarWidth = d => {
        const value = d.value;
        return xScale(value);
    }

    const getXAxisMarkPosition = (_, i) => {
        return xScale(i * (100/categoryOrder.length)) + labelsSize;
    }

    const getXAxisTextMarkPosition = (_, i) => {
        return xScale(i * (100/categoryOrder.length)) + labelsSize + (xScale(100/categoryOrder.length) / 2);
    }
    
    // Selections
    const parentSelection = select(element);

    let container = parentSelection.selectAll('g.container')
                                     .data([data])
                                     .join(enter => enter.append('g').classed('container', true))
                                     .attr('transform', `translate(${xRange[0]}, ${yRange[0]})`);
                                     
    const markContainer = container.selectAll('g.mark-container')
                                   .data(data)
                                   .join(enter => {
                                        const innerContainer = enter.append('g').classed('mark-container', true);
            
                                        innerContainer.append('g').classed('mark', true);

                                        innerContainer.append('text').classed('label1', true);
                                        innerContainer.append('text').classed('label2', true);
                                    
                                        return innerContainer;
                                   });


    const axisContainer = ensureElement({
        parent: container,
        elementType: 'g',
        className: 'axis-container'
    });

    markContainer.selectAll('g.mark')
                 .selectAll('rect.mark-background')
                 .data(getCategories)
                 .join(enter => enter.append('rect').classed('mark-background', true))
                 .attr('y', getBarYPosition)
                 .attr('x', getBarXPosition)
                 .attr('width', getBarWidth)
                 .attr('height', calculatedBarSize)
                 .attr('filter', 'url(#filter-g9odhc_gqf-2)')
                 ;

    markContainer.selectAll('g.mark')
                 .selectAll('rect.mark-foreground')
                 .data(getCategories)
                 .join(enter => enter.append('rect').classed('mark-foreground', true))
                 .attr('y', getBarYPosition)
                 .attr('x', getBarXPosition)
                 .attr('width', getBarWidth)
                 .attr('height', calculatedBarSize)
                 .attr('fill', (_, i) => {
                    const color = colorRange[i];
                    return color;
                  })
                 .attr('fill-opacity', '0.6')
                 .attr('stroke', '#654321')
                 .attr('stroke-opacity', '0.2')
                 .attr('stroke-width', 2)
                 ;

    // Mark connectors
    const connectorCaches = {};
    const getConnectorPosition = (d, i) => {
        const { original_index, name } = d; 
        const cacheKey = `${i}_${original_index}`;

        if (connectorCaches[cacheKey]) {
            return connectorCaches[cacheKey];
        }

        let sourceX = 0;
        let sourceY = 0;

        if (original_index > 0) {
            const categories = data[original_index - 1].categories;
            const previousPoint = categories.find(value => value.name === name);

            sourceX = getBarXPosition(previousPoint) + getBarWidth(previousPoint);
            sourceY = getBarYPosition(previousPoint) + calculatedBarSize;

        } else {
            sourceX = getXAxisMarkPosition(d, i) + xScale(100/categoryOrder.length);
            sourceY = axisLabelsSize + barSize;
        }

        const targetX = getBarXPosition(d) + getBarWidth(d);
        const targetY = getBarYPosition(d);

        const ret = {
            x1: sourceX,
            x2: targetX,
            y1: sourceY,
            y2: targetY
        };

        connectorCaches[cacheKey] = ret;

        return ret;
    }
    
    markContainer.selectAll('g.mark')
                 .selectAll('line.mark-connector-left')
                 .data(getCategories)
                 .join(enter => enter.append('line').classed('mark-connector-left', true))
                 .attr('x1', (d, i) => {
                    const position = getConnectorPosition(d, i);
                    return position.x1;
                 })
                 .attr('y1', (d, i) => {
                    const position = getConnectorPosition(d, i);
                    return position.y1;
                 })
                 .attr('x2', (d, i) => {
                    const position = getConnectorPosition(d, i);
                    return position.x2;
                 })
                 .attr('y2', (d, i) => {
                    const position = getConnectorPosition(d, i);
                    return position.y2;
                 })
                 .attr('stroke', '#654321')
                 .attr('stroke-opacity', (d, i) => {
                    // Hide is the source and target are one of the edges
                    const position = getConnectorPosition(d, i);
                    const xScaleRange = xScale.range();
                    if (
                        (Math.abs(position.x1 - (xScaleRange[0] + labelsSize)) < 15 || 
                         Math.abs(position.x1 - (xScaleRange[1] + labelsSize)) < 15) &&
                        (Math.abs(position.x2 - (xScaleRange[0] + labelsSize)) < 15 || 
                         Math.abs(position.x2 - (xScaleRange[1] + labelsSize)) < 15)
                    ) {
                        return 0;
                    }

                    return 0.2;
                 })
                 .attr('stroke-width', 2)
                 ;

    // Bar labels
    markContainer.selectAll('g.mark')
                 .selectAll('text.mark-label')
                 .data(getCategories)
                 .join(enter => enter.append('text').classed('mark-label', true))
                 .attr('x', (d, i) => {
                    const position = getBarXPosition(d, i);
                    const width = getBarWidth(d, i);
                    return position + (width / 2);
                 })
                 .attr('y', (d, i) => {
                    const position = getBarYPosition(d, i);
                    const height = calculatedBarSize;
                    return position + (height / 2);
                 })
                 .attr('text-anchor', 'middle')
                 .attr('alignment-baseline', 'middle')
                 .attr('font-family', 'Charter')
                 .attr('fill-opacity', (d, i) => {
                    const width = getBarWidth(d, i);
                    if (width < 10) return 0;
                    return 0.9;
                 })
                 .attr('font-size', 14)
                 .attr('font-weight', 'bold')
                 .attr('fill', (_, i) => i === 0 ? 'white' : 'black')
                 .text(d => `${d.value}%`)


    // Vertical labels selection
    markContainer.select('text.label1')
                 .attr('x', 0)
                 .attr('y', (_, i) => yScale(i) + calculatedBarSize / 2)
                 .text(getClass)
                 .attr('text-anchor', 'start')
                 .attr('alignment-baseline', 'middle')
                 .attr('font-family', 'Charter')
                 .attr('fill-opacity', 0.9)
                 .attr('font-size', 12)
                 ;

    markContainer.select('text.label2')
                 .attr('x', labelsSize - 10)
                 .attr('y', (_, i) => yScale(i) + calculatedBarSize / 2)
                 .text(d => `$${getAverage(d)}`)
                 .attr('text-anchor', 'end')
                 .attr('alignment-baseline', 'middle')
                 .attr('font-family', 'Charter')
                 .attr('fill-opacity', 0.9)
                 .attr('font-size', 12)
                 .attr('font-weight', 'bold')
                ;

    // Axis selection
    axisContainer.selectAll('rect.axis-mark-background')
                 .data(categoryOrder)
                 .join(enter => enter.append('rect').classed('axis-mark-background', true))
                 .attr('y', axisLabelsSize)
                 .attr('x', getXAxisMarkPosition)
                 .attr('width', xScale(100/categoryOrder.length))
                 .attr('height', barSize)
                 .attr('filter', 'url(#filter-g9odhc_gqf-2)')
                 ;

    axisContainer.selectAll('rect.axis-mark-foreground')
                 .data(categoryOrder)
                 .join(enter => enter.append('rect').classed('axis-mark-foreground', true))
                 .attr('y', axisLabelsSize)
                 .attr('x', getXAxisMarkPosition)
                 .attr('width', xScale(100/categoryOrder.length))
                 .attr('height', barSize)
                 .attr('fill', (_, i) => colorRange[i])
                 .attr('fill-opacity', '0.6')
                 .attr('stroke', '#654321')
                 .attr('stroke-opacity', '0.2')
                 .attr('stroke-width', 2)
                 ;

    axisContainer.selectAll('text.axis-mark-text')
                 .data(categoryOrder)
                 .join(enter => enter.append('text').classed('axis-mark-text', true))
                 .attr('y', 12)
                 .attr('x', getXAxisTextMarkPosition)
                 .attr('text-anchor', 'middle')
                 .attr('alignment-baseline', 'middle')
                 .attr('font-family', 'Charter')
                 .attr('fill-opacity', 0.9)
                 .attr('font-size', 14)
                 .attr('dx', -5)
                 .text(d => `${d.toUpperCase()}`)
                 ;

    // Vertical labels headers
    axisContainer.selectAll('text.label-header')
                 .data(['Class', 'Actual Average'])
                 .join(enter => enter.append('text').classed('label-header', true))
                 .attr('x', (_, i) => {
                    if (i === 0) return 0;
                    return labelsSize - 10;
                 })
                 .attr('y', yScale.range()[0])
                 .text(d => d)
                 .attr('text-anchor', (_, i) => i === 0 ? 'start' : 'end')
                 .attr('alignment-baseline', 'middle')
                 .attr('font-family', 'Charter')
                 .attr('fill-opacity', 0.9)
                 .attr('font-size', 12)
                 .attr('font-weight', (_, i) => i === 0 ? '' : 'bold')
                 .attr('dy', '-1em')
                 ;

    // Class groups
    const classGroupPositionCache = {};
    const positionForClassGroup = (group, index) => {
        if (classGroupPositionCache[index]) return classGroupPositionCache[index];

        const classGroup = classGroupRanges.find(d => d.name === group.name);

        const fromDataPoint = classGroup.values[0];
        const toDataPoint = classGroup.values[classGroup.values.length - 1];

        const ret = {
            y1: yScale(fromDataPoint.index),
            y2:  yScale(toDataPoint.index) + calculatedBarSize,
        };

        classGroupPositionCache[index] = ret;

        return ret;
    }

    axisContainer.selectAll('text.axis-class-group-text')
                 .data(classGroups)
                 .join(enter => enter.append('text').classed('axis-class-group-text', true))
                 .attr('text-anchor', 'middle')
                 .attr('alignment-baseline', 'middle')
                 .attr('font-family', 'Charter')
                 .attr('fill', '#654321')
                 .attr('fill-opacity', 0.9)
                 .attr('font-size', 12)
                 .attr('transform', (d, i) => {
                    const position = positionForClassGroup(d, i);
                    const y = position.y1 + ((position.y2 - position.y1) / 2);
                    const x = xScale.range()[1] + labelsSize + rightLabelsSize - 12;

                    return `translate(${x}, ${y}) rotate(-90)`;
                 })
                 .text(d => `${d.name.toUpperCase()}`)
                 ;

    axisContainer.selectAll('path.axis-class-group-arrow')
                 .data(classGroups)
                 .join(enter => enter.append('path').classed('axis-class-group-arrow', true))
                 .attr('stroke', '#654321')
                 .attr('stroke-opacity', 0.2)
                 .attr('stroke-width', 2)
                 .attr('fill', 'none')
                 .attr('d', (d, i) => {
                    const position = positionForClassGroup(d, i);
                    const { y1, y2 } = position;
                    const x = xScale.range()[1] + labelsSize;

                    return rightArrow({x: x + 5, y1: y1 - 10, y2: y2 + 10});
                 })
                 ;
};

const Chart = ({
    size
}) => {
    const containerRef = useRef(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const data = await getSource10();
            
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