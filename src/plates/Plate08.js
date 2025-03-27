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
import { getSource08 } from '../util/data';
import Background from '../components/Background';
import { ensureElement, layoutContainersVertically, layoutContainersVerticallyWithAggregation } from '../util/d3util';
import { connectorPath, snakePath } from '../util/geometry';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "Occupations for Georgia Black Males over 10 in 1890";

const TitleTextStyle = {
    font: "1.2em 'B52-ULC W00 ULC'"
}

const labelSize = 250;

const barSize = 12;

const aggregateThreshold = 2500;

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

const Visualization = ({
    element, 
    size,
    data
}) => {
    if (data.length == 0) return;

    // Getters
    const count = d => d.count;
    const occupation = d => d.occupation;

    // Aggregation for lower values
    const aggregatedValues = data.filter(d => count(d) <= aggregateThreshold);
    const aggregatedValuesRange = [aggregatedValues[0], aggregatedValues[aggregatedValues.length - 1]];
    const aggregatedTotal = aggregatedValues.reduce((previous, next) => previous + count(next), 0);

    if (!data[data.length - 1].isAggregated) {
        data.push({
            count: aggregatedTotal,
            occupation: 'aggregated',
            isAggregated: true
        });
    }
    
    // Add the index to all the items
    data.forEach((d, i) => {
        d.index = i;
    });

    // Ranges
    const yRange = getYRange(size);
    const xRange = getXRange(size);
    const maxBarWidth = xRange[1] - xRange[0] - labelSize;

    // Scales
    // Sort the values from lowest to highest, we don't include the highest value in the count
    const counts = data.map(count).sort((a, b) => b - a);
    const xScale = scaleLinear([0, counts[1]], [0, maxBarWidth]);
    
    // Selections
    const parentSelection = select(element);

    let container = parentSelection.selectAll('g.container')
                                     .data([data])
                                     .join(enter => enter.append('g').classed('container', true))
                                     .attr('transform', `translate(${xRange[0]}, ${yRange[0]})`);
    
    let connectorContainer = parentSelection.selectAll('g.container-connectors')
                                     .data([data])
                                     .join(enter => enter.append('g').classed('container-connectors', true));
                                     
    const markContainer = container.selectAll('g.mark-container')
                                   .data(data)
                                   .join(enter => {
                                        const innerContainer = enter.append('g').classed('mark-container', true);
            
                                        innerContainer.append('path').classed('mark-background', true);
                                        innerContainer.append('path').classed('mark-foreground', true);
                                        innerContainer.append('text').classed('label', true);
                                        innerContainer.append('text').classed('value', true);
                                    
                                        return innerContainer;
                                   });

    const pathGenerator = d => {
        const calculatedLength = xScale(count(d));

        const path = snakePath({
            x: d.isAggregated ? 0 : labelSize,
            y: 0,
            width: barSize,
            gap: barSize,
            length: calculatedLength,
            maxLength: maxBarWidth
        });

        return path;
    }

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

    markContainer.select('text.label')
             .attr('x', labelSize - 40)
             .attr('y', barSize / 2)
             .text(d => {
                if (d.isAggregated) return '';
                return occupation(d);
             })
             .attr('text-anchor', 'end')
             .attr('alignment-baseline', 'middle')
             .attr('font-family', 'Charter')
             .attr('fill-opacity', 0.9)
             .attr('font-size', 11)
             .attr('dx', -5)
             ;

    markContainer.select('text.value')
             .attr('x', labelSize - 3)
             .attr('y', barSize / 2)
             .text(d => {
                if (d.isAggregated) return '';
                return count(d);
             })
             .attr('text-anchor', 'end')
             .attr('alignment-baseline', 'middle')
             .attr('font-family', 'Charter')
             .attr('font-weight', 'bold')
             .attr('fill-opacity', 0.9)
             .attr('font-size', 11)
             .attr('dx', -5)
             ;

    layoutContainersVerticallyWithAggregation({
        selection: markContainer,
        spacing: 18,
        isAggregatedNode: d => d.isAggregated,
        shouldAggregate: d => count(d) <= aggregateThreshold
    });

    // Add the connector line
    ensureElement({
        parent: connectorContainer,
        elementType: 'path',
        className: 'connector'
    }).attr('fill', 'none')
      .attr('stroke', '#654321')
      .attr('stroke-opacity', '0.2')
      .attr('stroke-width', 2)
      .attr('d', connectorPath({
        fromNodeSelection: markContainer.selectAll(`path.mark-foreground[data-should-aggregate='1']`),
      }))
      ;
};

const Chart = ({
    size
}) => {
    const containerRef = useRef(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const data = await getSource08();
            
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