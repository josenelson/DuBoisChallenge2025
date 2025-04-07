import React, { useRef, useEffect, useState } from 'react';
import { 
    scaleLinear, 
    line, 
    extent, 
    select,
    scaleQuantile,
    min,
    format
} from 'd3';
import { getSource10 } from '../util/data';
import Background from '../components/Background';
import { ensureElement, layoutContainersVertically, layoutContainersVerticallyWithAggregation } from '../util/d3util';
import { connectorPath, snakePath } from '../util/geometry';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "WIP Visualization";

const TitleTextStyle = {
    font: "1.2em 'B52-ULC W00 ULC'"
}

const labelsSize = 165;

const barSize = 12;

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

const categoryOrder = ['rent', 'food', 'clothes', 'other'];

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

    // Ranges
    const yRange = getYRange(size);
    const xRange = getXRange(size);
    const maxBarWidth = xRange[1] - xRange[0] - labelsSize;

    // Scales
    const xScale = scaleLinear([0, 100], [0, maxBarWidth]);
    const yScale = scaleLinear([0, data.length], yRange);
    
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
            
                                        innerContainer.append('g.mark').classed('mark', true);

                                        innerContainer.append('text').classed('label1', true);
                                        innerContainer.append('text').classed('label2', true);
                                    
                                        return innerContainer;
                                   });

    markContainer.selectAll('g.mark')
                 .selectAll('rect.mark-background')
                 .data(getCategories)
                 .join(enter => enter.append('rect').classed('mark-background', true))

    /*

    markContainer.select('path.mark-background')
                 .attr('d', pathGenerator)
                 .attr('filter', 'url(#filter-g9odhc_gqf-2)')
                 ;

    markContainer.select('path.mark-foreground')
                 .attr('d', pathGenerator)
                 .attr('fill', '#DC143C')
                 .attr('fill-opacity', '0.4')
                 .attr('stroke', '#654321')
                 .attr('stroke-opacity', '0.2')
                 .attr('stroke-width', 2)
                 .attr('data-aggregated', d => d.isAggregated ? 1 : 0)
                 .attr('data-should-aggregate', d => count(d) <= aggregateThreshold ? 1 : 0)
                 ;
    */

    markContainer.select('text.label1')
                 .attr('x', 40)
                 .attr('y', (_, i) => yScale(i) + barSize / 2)
                 .text(getClass)
                 .attr('text-anchor', 'start')
                 .attr('alignment-baseline', 'middle')
                 .attr('font-family', 'Charter')
                 .attr('fill-opacity', 0.9)
                 .attr('font-size', 12)
                 .attr('dx', -5)
                 ;

    markContainer.select('text.label2')
                 .attr('x', labelsSize - 10)
                 .attr('y', (_, i) => yScale(i) + barSize / 2)
                 .text(d => `$${getAverage(d)}`)
                 .attr('text-anchor', 'end')
                 .attr('alignment-baseline', 'middle')
                 .attr('font-family', 'Charter')
                 .attr('fill-opacity', 0.9)
                 .attr('font-size', 12)
                 .attr('font-weight', 'bold')
                 .attr('dx', -5)
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