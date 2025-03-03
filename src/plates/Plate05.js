import React, { useRef, useEffect, useState } from 'react';
import { 
    scaleLinear, 
    scaleBand, 
    extent, 
    select, 
    scaleQuantile, 
    geoPath, 
    geoIdentity,
    min
} from 'd3';
import { getSource05 } from '../util/data';
import Background from '../components/Background';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText =  "WIP \nVisualization"; //"Acres of \nland \nowned by \nBlack \nGeorgians \n1970-1900";

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

const colorRange = ['#7e6583', '#4682b4', '#00aa00', '#dc143c', '#ffc0cb', '#ffd700', '#d2b48c', '#654321', '#000000'];

const Visualization = ({
    element, 
    size,
    data
}) => {
    if (data.length == 0) return;

    // Data ranges
    const yRange = getYRange(size);
    const xRange = getXRange(size);
    
    const circleTotalSize = min([yRange[1] - yRange[0], xRange[1] - xRange[0]]);
    const circleCenter = [xRange[0] + ((xRange[1] - xRange[0]) / 2), yRange[0] + ((yRange[1] - yRange[0]) / 2)];

    // Scales
    const radiusScale = scaleLinear([0, data[data.length - 1].value], [0, circleTotalSize / 2]);

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

    container.attr('transform', `translate(${xRange[0]}, ${yRange[0]})`);

    const pathGenerator = (startRadius, endRadius) => {
        const commands = [
            `M ${circleCenter[0]}, ${circleCenter[1]}`, // Move to center of ring
            `m 0, -${endRadius}`, // Move to top of ring
            `a ${endRadius}, ${endRadius}, 0, 1, 0, 1, 0`, // Draw outer arc, but don't close it
            `Z`, // default fill-rule:even-odd will help create the empty innards
            `m 1 ${endRadius - startRadius}`, // Move to top point of inner radius
            `a ${startRadius}, ${startRadius}, 0, 1, 1, -1, 0`, // Close the inner ring. Actually will still work without, but inner ring will have one unit missing in strok
            `Z`
        ];

        return commands.join(' ');
    };

    parentSelection.selectAll('path.mark')
                   .data(data.reverse())
                   .join(
                        enter => enter.append('path').classed('mark', true)
                   )
                   .attr('d', (d, i) => {
                        const startRadius = 0;
                        const endRadius = radiusScale(d.value);

                        return pathGenerator(startRadius, endRadius);
                   })
                   .attr('shape-rendering', 'crispEdges')
                   .attr('fill', (_, i) => colorRange[i]);

    parentSelection.selectAll('text.label-year')
                   .data(data)
                   .join(
                        enter => enter.append('text').classed('label-year', true)
                   )
                   .attr('text-anchor', 'middle')
                   .attr('alignment-baseline', 'top')
                   .attr('font-family', 'Charter')
                   .attr('font-weight', 'bold')
                   .attr('fill-opacity', 0.7)
                   .attr('font-size', 14)
                   .attr('x', circleCenter[0])
                   .attr('y', d => {
                        const endRadius = radiusScale(d.value);
                        return circleCenter[1] + endRadius;
                   })
                   .text(d => d.year);
};

const Chart = ({
    size
}) => {
    const containerRef = useRef(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const data = await getSource05();
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