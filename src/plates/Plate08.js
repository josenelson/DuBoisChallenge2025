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
import { ensureElement } from '../util/d3util';
import { snakePath } from '../util/geometry';

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

    // Data ranges
    const count = d => d.count;
    const occupation = d => d.occupation;
    
    const countRange = extent(data, count);
    const occupationRange = extent(data, occupation);

    const yRange = getYRange(size);
    const xRange = getXRange(size);

    // Scales
    
    // Selections
    const parentSelection = select(element);

    let container = parentSelection.selectAll('g.container')
                                     .data([data])
                                     .join(enter => enter.append('g').classed('container', true));

    container.selectAll('path.mark')
             .data([data])
             .join(enter => enter.append('path').classed('mark', true))
             .attr('d', (d, i) => {
                const x = 100;
                const y = 100;
                const width = 20;
                const length = 400;
                const maxLength = 200;
                const gap = 50;

                return snakePath({
                    x: x,
                    y: y,
                    width: width,
                    length: length,
                    gap: gap,
                    maxLength: maxLength
                });
            })
            .attr('stroke', 'black')
            .attr('fill', 'none')
            .attr('stroke-width', 3)
            //.attr('stroke-opacity', 0.9)
            .attr('fill-opacity', 0);
            ;

    container.selectAll('text.y-label')
             .data(data)
             .join(
                enter => enter.append('text').classed('value-label', true)
             )
             .attr('x', 0)
             .attr('y', 0)
             .text(d => {
                return occupation(d);
             })
             .attr('text-anchor', 'end')
             .attr('alignment-baseline', 'middle')
             .attr('font-family', 'Charter')
             .attr('font-weight', 'bold')
             .attr('fill-opacity', 0.9)
             .attr('font-size', 14)
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