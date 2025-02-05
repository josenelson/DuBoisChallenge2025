import React, { useRef, useEffect } from 'react';
import { scaleLinear, extent, select  } from 'd3';

const topMargin = 100;
const leftMargin = 100;
const bottomMargin = 100;
const itemHeight = 100;
const itemBaseWidth = 100;
const titleText = "Value of land \nowned by \nGeorgia negroes";

const Visualization = ({
    element, 
    size,
    data
}) => {
    if (data.length == 0) return; // bail out if we don't have data
    
    const dataRange = extent(data, d => d.value);
    const width = scaleLinear(dataRange, [itemBaseWidth, itemBaseWidth * 2]);

    const yPosition = scaleLinear([0, data.length], [topMargin, size.height - (bottomMargin)]);
    const xPosition = (d, i) => (size.width / 2) - (width(d.value) / 2);

    let parentSelection = select(element).selectAll("g").data(data);
    
    // Container element for each one
    parentSelection = parentSelection.join(
        enter => {
            let container = enter.append('g');

            container.append('rect').classed('mark', true);
            container.append('text').classed('value', true);
            container.append('text').classed('year', true);

            return container;
        }
    ).attr('transform', (d, i) => `translate(${xPosition(d, i)} ${yPosition(i)})`);

    // Properties for the individual marks
    parentSelection.select('.mark')
                   .attr('width', d => width(d.value))
                   .attr('height', itemHeight)
                   .attr('fill', 'yellow');

    // Properties for the year text
    parentSelection.select('.value')
                   .attr('x', d => width(d.value) / 2)
                   .attr('y', itemHeight / 2)
                   .attr('text-anchor', 'middle')
                   .attr('alignment-baseline', 'hanging')
                   .text(d => `$${d.value}`);

    // Properties for the value text
    parentSelection.select('.year')
                   .attr('x', d => width(d.value) / 2)
                   .attr('y', itemHeight)
                   .attr('text-anchor', 'middle')
                   .attr('alignment-baseline', 'hanging')
                   .text(d => d.year);
};

const Chart = ({
    data,
    size
}) => {
    const containerRef = useRef(null);
    
    data = data.sort((a, b) => a.year - b.year);

    useEffect(() => {
        if (containerRef.current) {
            Visualization({element: containerRef.current, data: data, size: size});
        }
    }, [data, size]);

    return (
        <svg className='plate'>
            <text x={leftMargin} y={topMargin}>
                {titleText.split('\n').map((text, i) => (
                    <tspan x={leftMargin} dy="1.2em" key={i}>{text}</tspan>
                ))}
            </text>
            <g ref={containerRef} />
        </svg>
    );
}

export default Chart;