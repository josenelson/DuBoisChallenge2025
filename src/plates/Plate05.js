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
import { describeArc } from '../util/geometry';

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
    
    const totalSlots = data.length;

    const slotPosition = index => {
        const delta = 360 / totalSlots;
        return index * delta;
    }

    const slotCount = index => {
        let count = totalSlots - index;
        if (count == 0) { 
            count = 1;
        }

        return count;
    }

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

    const pathGenerator = (startRadius, endRadius, angles = []) => {
        return describeArc({
            x: circleCenter[0], 
            y: circleCenter[1], 
            startRadius: startRadius, 
            endRadius: endRadius,
            angles: angles
        });
    };

    container.selectAll('path.mark')
                   .data(data)
                   .join(
                        enter => enter.append('path').classed('mark', true)
                   )
                   .attr('d', (d, i) => {
                        // Need to caculate how many slots each one has
                        //  there's always data.length slots but not all of them might be visible
                        const count = slotCount(i);
                        const slots = [];
                        for (let index = 0; index < count; index++) {
                            const slotAnglePosition = slotPosition(index);
                            slots.push({
                                index: index,
                                startAnglePosition: slotAnglePosition,
                                endAnglePosition: slotAnglePosition + 10
                            });
                        }

                        console.log(`actualIndex=${i}`, slots);

                        const startRadius = radiusScale(d.value);
                        let endRadius = 0;

                        if (i > 0) {
                            endRadius = radiusScale(data[i - 1].value);
                        }

                        const angles = [
                            {start: 45 - (i * 2), end: 300 + (i * 2)}
                        ];

                        return pathGenerator(
                            startRadius,
                            endRadius,
                            angles
                        );
                   })
                   .attr('stroke', 'black')
                   .attr('stroke-width', '2')
                   .attr('fill', (_, i) => colorRange[i])
                   .attr('opacity', (_, i) => i === 3 ? 1 : 0);

    container.selectAll('text.label-year')
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