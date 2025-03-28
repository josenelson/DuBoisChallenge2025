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
import { describeArc } from '../util/geometry';

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
    const angleScaleGroupB = scaleLinear([0, 100], [210, 330]);
    const angleScaleGroupW = scaleLinear([0, 100], [30,150]);
    const colorScale = scaleQuantile(occupations, ['#7e6583', '#4682b4', '#00aa00', '#dc143c', '#ffc0cb', '#ffd700', '#d2b48c', '#654321', '#000000']);

    const circleTotalSize = min([yRange[1] - yRange[0], xRange[1] - xRange[0]]);
    const circleRadius = circleTotalSize / 2;
    const circleCenter = [xRange[0] + ((xRange[1] - xRange[0]) / 2), yRange[0] + ((yRange[1] - yRange[0]) / 2)];
    
    // Path generators
    const groupBPathGenerator = (d, i) => {
        const percentage = getPercentage(d);
        const accumulatedPercentage = groupBAcc[i];

        const startAngle = angleScaleGroupB(accumulatedPercentage);
        const endAngle = angleScaleGroupB(accumulatedPercentage + percentage);
        
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
        const percentage = getPercentage(d);
        const accumulatedPercentage = groupWAcc[i];

        const startAngle = angleScaleGroupW(accumulatedPercentage);
        const endAngle = angleScaleGroupW(accumulatedPercentage + percentage);
        
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