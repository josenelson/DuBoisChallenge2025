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
import { getSource08, getSource09 } from '../util/data';
import Background from '../components/Background';
import { ensureElement, layoutContainersVertically, layoutContainersVerticallyWithAggregation } from '../util/d3util';
import { describeArc, describeArcPoint, legend2ColumnLayout } from '../util/geometry';

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

const mapAccumulator = () => {
    let acc = 0;

    return d => {
        const ret = acc;
        acc += d;
        return ret;
    }
}

const Visualization = ({
    element, 
    size,
    data
}) => {
    if (data.length == 0) return;

    const labelPointCache = {};

    // Getters
    const getGroup = d => d.group;
    const getPercentage = d => d.percentage;
    const getOccupation = d => d.occupation;
    const groupB = data.filter(d => getGroup(d) === 'b');
    const groupW = data.filter(d => getGroup(d) === 'w');
    const groupBAcc = groupB.map(getPercentage).map(mapAccumulator());
    const groupWAcc = groupW.map(getPercentage).map(mapAccumulator());

    // Ranges
    const yRange = getYRange(size);
    const xRange = getXRange(size);
    const occupations = data.map(getOccupation).filter((d, i, arr) => arr.indexOf(d) === i);

    // Scales
    const groupBAngleRange = [210, 330];
    const groupWAngleRange = [30, 150];
    const angleScaleGroupB = scaleLinear([0, 100], groupBAngleRange);
    const angleScaleGroupW = scaleLinear([0, 100], groupWAngleRange);
    const colorScale = scaleQuantile(occupations, ['#7e6583', '#4682b4', '#00aa00', '#dc143c', '#ffc0cb', '#ffd700', '#d2b48c', '#654321', '#000000']);

    const circleTotalSize = min([yRange[1] - yRange[0], xRange[1] - xRange[0]]) - 32;
    const circleRadius = circleTotalSize / 2;
    const circleCenter = [xRange[0] + ((xRange[1] - xRange[0]) / 2), yRange[0] + ((yRange[1] - yRange[0]) / 2)];
    
    // Path generators
    const groupBAngles = (d, i) => {
        const percentage = getPercentage(d);
        const accumulatedPercentage = groupBAcc[i];

        const startAngle = angleScaleGroupB(accumulatedPercentage);
        const endAngle = angleScaleGroupB(accumulatedPercentage + percentage);

        return [startAngle, endAngle];
    }

    const groupWAngles = (d, i) => {
        const percentage = getPercentage(d);
        const accumulatedPercentage = groupWAcc[i];

        const startAngle = angleScaleGroupW(accumulatedPercentage);
        const endAngle = angleScaleGroupW(accumulatedPercentage + percentage);

        return [startAngle, endAngle];
    }

    const groupBPathGenerator = (d, i) => {
        const [startAngle, endAngle] = groupBAngles(d, i);
        
        const path = describeArc({
            x: circleCenter[0],
            y: circleCenter[1],
            outerRadius: circleRadius,
            innerRadius: 0,
            startAngle: startAngle,
            endAngle: endAngle
        });

        return path;
    }

    const groupWPathGenerator = (d, i) => {
        const [startAngle, endAngle] = groupWAngles(d, i);
        
        const path = describeArc({
            x: circleCenter[0],
            y: circleCenter[1],
            outerRadius: circleRadius,
            innerRadius: 0,
            startAngle: startAngle,
            endAngle: endAngle
        });

        return path;
    }

    const pointForPath = (d, i) => {
        if (labelPointCache[i]) {
            return labelPointCache[i];
        }

        const group = getGroup(d);
        let angles;
        if (group === 'b') {
            angles = groupBAngles(d, i);
        } else {
            angles = groupWAngles(d, i - groupB.length);
        }

        const [startAngle, endAngle] = angles;

        const point = describeArcPoint({
            x: circleCenter[0],
            y: circleCenter[1],
            radius: circleRadius + 8,
            startAngle: startAngle,
            endAngle: endAngle
        });

        labelPointCache[i] = point;

        return point;
    }

    // Selections
    const parentSelection = select(element);

    let container = parentSelection.selectAll('g.container')
                                     .data([data])
                                     .join(enter => enter.append('g').classed('container', true))
                                     .attr('transform', `translate(${0}, ${0})`);
    
    // First group
    container.selectAll('path.mark-group-b')
             .data(groupB)
             .join(enter => enter.append('path').classed('mark-group-b', true))
             .attr('d', groupBPathGenerator)
             .attr('stroke', 'black')
             .attr('fill', (d) => {
                return colorScale(getOccupation(d));
             })
             .attr('stroke-width', 1)
             .attr('stroke-opacity', 0.9)
             .attr('fill-opacity', 0.65);

    // Second group
    container.selectAll('path.mark-group-w')
             .data(groupW)
             .join(enter => enter.append('path').classed('mark-group-w', true))
             .attr('d', groupWPathGenerator)
             .attr('stroke', 'black')
             .attr('fill', (d) => {
                return colorScale(getOccupation(d));
             })
             .attr('stroke-width', 1)
             .attr('stroke-opacity', 0.9)
             .attr('fill-opacity', 0.65);

    // Labels for values
    container.selectAll('text.value-label')
             .data(data)
             .join(enter => enter.append('text').classed('value-label', true))
             .attr('x', (d, i) => {
                const point = pointForPath(d, i);
                return point.x;
             })
             .attr('y', (d, i) => {
                const point = pointForPath(d, i);
                return point.y;
             })
             .attr('text-anchor', (d, i) => {
                const point = pointForPath(d, i);
                if (point.x >= circleCenter[0]) {
                    return 'start';
                }
                return 'end';
             })
             .attr('alignment-baseline', 'middle')
             .attr('font-family', 'Charter')
             .attr('font-weight', 'bold')
             .attr('fill-opacity', 0.9)
             .attr('font-size', 11)
             .text(d => {
                return `${getPercentage(d)}%`;
             })
             ;

    // Labels for groups
    container.selectAll('text.group-label')
             .data(['BLACK', 'WHITE'])
             .join(enter => enter.append('text').classed('group-label', true))
             .attr('x', circleCenter[0])
             .attr('y', (_, i) => {
                if (i == 0) {
                    return circleCenter[1] - circleRadius - 12;
                }
                return circleCenter[1] + circleRadius + 12;
             })
             .attr('text-anchor', 'middle')
             .attr('font-family', 'Charter')
             .attr('font-weight', 'bold')
             .attr('fill-opacity', 0.9)
             .attr('font-size', 14)
             .attr('dy', (_, i) => {
                if (i === 0) {
                    return '-1.2em';
                }
                return '1.2em';
             })
             .text(d => d)
             ;
    
    // Legends
    const bulletRadius = 10;
    const point1 = describeArcPoint({x: circleCenter[0], y: circleCenter[1], radius: circleRadius, startAngle: groupBAngleRange[0], endAngle: groupBAngleRange[0]});
    const point2 = describeArcPoint({x: circleCenter[0], y: circleCenter[1], radius: circleRadius, startAngle: groupWAngleRange[0], endAngle: groupWAngleRange[0]});

    const layout = legend2ColumnLayout({
        itemCount: occupations.length,
        startX: point1.x,
        startY: point1.y,
        endX: point2.x,
        endY: point2.y,
        bulletSize: bulletRadius * 1,
        verticalPadding: 60,
    });

    const legendPositions = occupations.reduce((acc, next, index) => {
        acc[next] = layout(index);
        return acc;
    }, {});
            
    // Legeng colors
    container.selectAll('circle.legend-colors-background')
             .data(occupations)
             .join(enter => enter.append('circle').classed('legend-colors-background', true))
             .attr('cx', d => {
                const position = legendPositions[d];
                return position.bullet.x;
             })
             .attr('cy', d => {
                const position = legendPositions[d];
                return position.bullet.y;
             })
             .attr('r', bulletRadius)
             ;

    container.selectAll('circle.legend-colors-foreground')
             .data(occupations)
             .join(enter => enter.append('circle').classed('legend-colors-foreground', true))
             .attr('cx', d => {
                const position = legendPositions[d];
                return position.bullet.x;
             })
             .attr('cy', d => {
                const position = legendPositions[d];
                return position.bullet.y;
             })
             .attr('r', bulletRadius)
             ;

    container.selectAll('text.legend-text')
             .data(occupations)
             .join(enter => enter.append('text').classed('legend-text', true))
             .attr('x', d => {
                const position = legendPositions[d];
                return position.text.x;
             })
             .attr('y', d => {
                const position = legendPositions[d];
                return position.text.y;
             })
             .attr('text-anchor', d => {
                const position = legendPositions[d];
                if (position.alignment == 1) {
                    return 'end';
                }

                return 'start';
             })
             .attr('font-family', 'Charter')
             .attr('fill-opacity', 0.9)
             .attr('font-size', 11)
             .attr('alignment-baseline', 'middle')
             .text(d => d);
};

const Chart = ({
    size
}) => {
    const containerRef = useRef(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const data = await getSource09();
            
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