import React, { useRef, useEffect, useState } from 'react';
import { scaleLinear, scaleBand, extent, select, easeCubic, format } from 'd3';
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
    data
}) => {
    if (data.length == 0) return;

    const valueRange = extent(data, d => d.value);
    const yRange = getYRange(size);
    const xRange = getXRange(size);

    const yScale = scaleBand(data.map(d => d.year), yRange)
                        .round(true)
                        .paddingInner(0.12)
                        .paddingOuter(0)
                        .align(0);
    const xScale = scaleLinear([0, valueRange[1]], [0, xRange[1] - xRange[0]]);

    const shouldShowValue = year => {
        if (data.length === 0) return false;

        if (data[0].year === year || data[data.length -1].year === year) {
            return true;
        }
        
        return false; 
    }

    const valueFormatter = format(",");

    let parentSelection = select(element).selectAll('g.mark').data(data);

    parentSelection = parentSelection.join(
        enter => {
            const container = enter.append('g').classed('mark', true);
           
            container.append('rect')
                     .classed('bar-filter', true);

            container.append('rect')
                     .classed('bar', true);

            container.append('text')
                     .classed('year', true);

            container.append('text')
                     .classed('value', true);
           
            return container;
        }
    );

    const barSelection = parentSelection.select('.bar');
    barSelection.attr('x', xRange[0])
                .attr('y', d => yScale(d.year))
                .attr('width', 0)
                .attr('height', yScale.bandwidth())
                .attr('fill', '#DC143C')
                .attr('rx', 2)
                .attr('stroke', '#654321')
                .attr('stroke-width', '1')
                .attr('stroke-opacity', '0.2')
                .attr('fill-opacity', '0.4')
                .transition()
                    .delay((d, i) => i * animationDelay)
                    .ease(easeCubic)
                    .attr('width', d => xScale(d.value));

    parentSelection.select('.bar-filter')
                   .attr('x', xRange[0])
                   .attr('y', d => yScale(d.year))
                   .attr('width', 0)
                   .attr('height', yScale.bandwidth())
                   .attr('fill', '#DC143C')
                   .attr('rx', 2)
                   .attr('filter', 'url(#filter-g9odhc_gqf-2)')
                   .attr('fill-opacity', '1')
                   .transition()
                        .delay((d, i) => i * animationDelay)
                        .ease(easeCubic)
                        .attr('width', d => xScale(d.value));

    parentSelection.select('.year')
                   .attr('text-anchor', 'start')
                   .attr('alignment-baseline', 'middle')
                   .attr('x', d => xRange[0] + xScale(d.value) + 10)
                   .attr('y', d => yScale(d.year))
                   .attr('dy', yScale.bandwidth() / 2)
                   .attr('font-family', 'Charter')
                   .attr('letter-spacing', '-1')
                   .attr('fill-opacity', '0')
                   .text(d => d.year)
                   .transition()
                        .delay((d, i) => i * animationDelay)
                        .attr('fill-opacity', '0.9');

    const valueSelection = parentSelection.select('.value');
    valueSelection.attr('text-anchor', 'start')
                  .attr('alignment-baseline', 'middle')
                  .attr('x', d => xRange[0] + 5)
                  .attr('y', d => yScale(d.year))
                  .attr('dy', yScale.bandwidth() / 2)
                  .attr('font-family', 'Charter')
                  .attr('font-weight', 'bold')
                  .attr('fill-opacity', 0)
                  .attr('data-year', d => d.year)
                  .text(d => valueFormatter(Math.round(d.value)));

    valueSelection.transition()
                  .delay((d, i) => i * animationDelay)
                        .attr('fill-opacity', data => shouldShowValue(data.year) ? '0.9' : '0');

    barSelection.on('mouseenter', (_, data) => {
        let selection = select(`.value[data-year="${data.year}"]`);
        selection.transition()
                 .delay(animationDelay)
                    .attr('fill-opacity', '0.9');
    });

    barSelection.on('mouseleave', (_, data) => {
        let selection = select(`.value[data-year="${data.year}"]`);
        selection.transition()
                 .delay(animationDelay * 2)
                    .attr('fill-opacity', () => {
                        return shouldShowValue(data.year) ? '0.9' : '0';
                    });
    });
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