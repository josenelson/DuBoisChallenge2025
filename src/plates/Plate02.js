import React, { useRef, useEffect, useState } from 'react';
import { scaleLinear, extent, select  } from 'd3';
import { getSource02 } from '../util/data';
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

const getYRange = (size) => {
    return [margins.top, size.height - (margins.bottom)];
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

    const valueRange = extent(data, d => d.value);
    const yRange = getYRange(size);
    const xRange = getXRange(size);

    /*
    // We need to calculate how much we have left for each element
    let scaleAdjusment = 1;
    let remainingItemHeight = (yRange[1] - yRange[0] - (labelTextSize * data.length) - (spacing * (data.length - 1))) / (data.length);
    if (remainingItemHeight < elementHeight) {
        scaleAdjusment = remainingItemHeight / elementHeight;
    }

    const resolvedElementHeight = elementHeight * scaleAdjusment;
    const resolvedElementWidth = elementWidth * scaleAdjusment;

    const scale = scaleLinear(dataRange, [scaleAdjusment, scaleAdjusment * 1.5]);

    let parentSelection = select(element).selectAll('g.mark').data(data);
    
    parentSelection = parentSelection.join(
        enter => {
            const container = enter.append('g').classed('mark', true);

            const shapeContainer = container.append('g').classed('shape-container', true);
            shapeContainer.append('path')
                          .classed('shape-background', true)
                          .attr('filter', 'url(#filter-72uyj5y9zw-2)')
                          .attr('d', BagOfMoney150x138);

            shapeContainer.append('path')
                          .classed('shape-foreground', true)
                          .attr('fill', '#654321')
                          .attr('fill-opacity', '0.4')
                          .attr('stroke', '#654321')
                          .attr('stroke-width', '1')
                          .attr('d', BagOfMoney150x138);

            container.append('text').classed('value', true);
            container.append('text').classed('year', true);

            return container;
        }
    ).attr('transform', (d, i) => `translate(${xPosition} ${yPosition(i)})`);

    // Returns the transform for position and scale of each one of the money bags
    const transform = (d) => {
        const widthRatio = scale(d.value);
        const heightRatio = scaleAdjusment;
        const xAdjustment = (elementWidth * widthRatio) / 2;// (resolvedElementWidth * widthRatio) / 2;

        return `translate(${-xAdjustment} 0) scale(${widthRatio} ${heightRatio}) `;
    }

    // Properties for money bags
    parentSelection.select('.shape-background')
                   .attr('transform', transform);

    parentSelection.select('.shape-foreground')
                   .attr('transform', transform);

    // Properties for the year text
    parentSelection.select('.value')
                   .attr('y', resolvedElementHeight / 2)
                   .attr('text-anchor', 'middle')
                   .attr('alignment-baseline', 'hanging')
                   .attr('font-family', 'Charter')
                   .attr('font-weight', 'bold')
                   .attr('fill-opacity', '0.9')
                   .text(d => `$${d.value}`);

    // Properties for the value text
    parentSelection.select('.year')
                   .attr('y', resolvedElementHeight + 8)
                   .attr('text-anchor', 'middle')
                   .attr('alignment-baseline', 'hanging')
                   .attr('font-family', 'Charter')
                   .attr('letter-spacing', '-1')
                   .attr('fill-opacity', '0.6')
                   .text(d => d.year);
                   */
};

const Chart = ({
    size
}) => {
    const containerRef = useRef(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        getSource02().then(data => {
            const sortedData = data.sort((a, b) => a.year - b.year)
            setData(sortedData)
        });
    }, []);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }
        
        Visualization({element: containerRef.current, data: data, size: size});
    }, [data, size]);

    return (
        <svg className='plate'>
            <defs>
                <filter x="-5.6%" y="-6.3%" width="111.3%" height="112.7%" filterUnits="objectBoundingBox" id="filter-72uyj5y9zw-2">
                    <feMorphology radius="5" operator="erode" in="SourceAlpha" result="shadowSpreadInner1"></feMorphology>
                    <feGaussianBlur stdDeviation="5" in="shadowSpreadInner1" result="shadowBlurInner1"></feGaussianBlur>
                    <feOffset dx="1" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
                    <feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"></feComposite>
                    <feColorMatrix values="0 0 0 0 0.396078431   0 0 0 0 0.262745098   0 0 0 0 0.129411765  0 0 0 0.228529283 0" type="matrix" in="shadowInnerInner1"></feColorMatrix>
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