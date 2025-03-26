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
import { getSource07 } from '../util/data';
import Background from '../components/Background';
import { ensureElement } from '../util/d3util';
import { describeArc, polarToCartesian } from '../util/geometry';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "ASSESSED VALUE OF HOUSEHOLD AND KITCHEN FURNITURE OWNED BY GEORGIA BLACKS";

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

const getQuadrant = angle => {
    if (angle <= 90) return 0;
    if (angle > 90 && angle <= 180) return 1;
    if (angle > 180 && angle <= 270) return 2;
    return 3;
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
    const radius = 32;
    const maxAngle = 270;

    const yRange = getYRange(size);
    const xRange = getXRange(size);

    const circleTotalSize = min([yRange[1] - yRange[0], xRange[1] - xRange[0]]);
    const circleRadius = circleTotalSize / 2;
    const circleCenter = [xRange[0] + ((xRange[1] - xRange[0]) / 2), yRange[0] + ((yRange[1] - yRange[0]) / 2)];
    
    // Scales
    const angleScale = scaleLinear([0, valueRange[1]], [0, maxAngle]);
    const outerRadiusScale = index => circleRadius - (index * radius);
    const colorScale = scaleQuantile(yearRange, ['#7e6583', '#4682b4', '#00aa00', '#dc143c', '#ffc0cb', '#ffd700', '#d2b48c', '#654321', '#000000']);

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

    container.selectAll('path.mark-background')
             .data(data)
             .join(enter => enter.append('path').classed('mark-background', true))
             .attr('d', (d, i) => {
                const outerRadius = outerRadiusScale(i);
                const angle = angleScale(value(d));

                const path = describeArc({
                    x: circleCenter[0],
                    y: circleCenter[1],
                    outerRadius: outerRadius,
                    innerRadius: outerRadius - radius,
                    angle: angle
                });

                return path;
             })
             .attr('filter', 'url(#filter-g9odhc_gqf-2)');

    container.selectAll('path.mark')
             .data(data)
             .join(enter => enter.append('path').classed('mark', true))
             .attr('d', (d, i) => {
                const outerRadius = outerRadiusScale(i);
                const angle = angleScale(value(d));

                const path = describeArc({
                    x: circleCenter[0],
                    y: circleCenter[1],
                    outerRadius: outerRadius,
                    innerRadius: outerRadius - radius,
                    angle: angle
                });

                return path;
            })
            .attr('stroke', 'black')
            .attr('fill', (d) => {
                return colorScale(year(d));
            })
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.9)
            .attr('fill-opacity', 0.65);

    const valueLabelLocation = (data, index) => {
        const location = polarToCartesian({
            centerX: circleCenter[0],
            centerY: circleCenter[1],
            radius: outerRadiusScale(index),
            angleInDegrees: 0
        });

        location.y += radius / 2;

        return location;
    };

    const valueLocation = (data, index) => {
        const location = polarToCartesian({
            centerX: circleCenter[0],
            centerY: circleCenter[1],
            radius: outerRadiusScale(index),
            angleInDegrees: angleScale(value(data))
        });

        location.y += radius / 2;

        return location;
    };

    container.selectAll('text.value-label')
             .data(data)
             .join(
                enter => enter.append('text').classed('value-label', true)
             )
             .attr('x', (d, i) => {
                const location = valueLabelLocation(d, i);
                return location.x;
             })
             .attr('y', (d, i) => {
                const location = valueLabelLocation(d, i);
                return location.y;
             })
             .text(d => {
                return year(d);
             })
             .attr('text-anchor', 'end')
             .attr('alignment-baseline', 'middle')
             .attr('font-family', 'Charter')
             .attr('font-weight', 'bold')
             .attr('fill-opacity', 0.9)
             .attr('font-size', 14)
             .attr('dx', -5)
             ;


    const quadrantForData = data => getQuadrant(angleScale(value(data)));

    const valueFormatter = format(",");

    container.selectAll('text.value')
             .data(data)
             .join(
                enter => enter.append('text').classed('value', true)
             )
             .text(d => {
                return `$${valueFormatter(value(d))}`;
             })
             .attr('text-anchor', d => {
                const quadrant = quadrantForData(d);

                if (quadrant == 0) return 'start';
                else if (quadrant == 1) return 'start';
                else if (quadrant == 2) return 'end';
                else if (quadrant == 3) return 'end';
             })
             .attr('alignment-baseline', d => {
                const quadrant = quadrantForData(d);

                if (quadrant == 0) return 'middle';
                if (quadrant == 1) return 'middle';
                if (quadrant == 2) return 'top';
                if (quadrant == 3) return 'top';
             })
             .attr('font-family', 'Charter')
             .attr('font-weight', 'bold')
             .attr('fill-opacity', 0.9)
             .attr('font-size', 14)
             .attr('dx', d => {
                const quadrant = quadrantForData(d);

                if (quadrant == 0) return 3;
                if (quadrant == 1) return 0;
             })
             .attr('dy', d => {
                const quadrant = quadrantForData(d);

                if (quadrant == 0) return 0;
                if (quadrant == 1) return radius / 2;
                if (quadrant == 2) return -(radius / 2) - 6;
             })
             .attr('transform', (d, i) => {
                const quadrant = quadrantForData(d);
                const location = valueLocation(d, i);

                let rotation = 0;
                let x = location.x;
                let y = location.y;

                if (quadrant == 0) rotation = 0;
                else if (quadrant == 1) rotation = 90;
                else if (quadrant == 2) rotation = 0;
                else if (quadrant == 3) rotation = -90;

                return `translate(${x}, ${y})rotate(${rotation})`
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
            const data = await getSource07();
            
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