import React, { useRef, useEffect, useState } from 'react';
import { 
    scaleLinear, 
    line, 
    extent, 
    select,
    curveNatural,
    min,
    max
} from 'd3';
import { getSource07 } from '../util/data';
import Background from '../components/Background';
import { ensureElement } from '../util/d3util';
import { describeArc } from '../util/geometry';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "WIP Visualization";

const TitleTextStyle = {
    font: "2em 'B52-ULC W00 ULC'"
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
    const value = d => d.value;
    const year = d => d.year;
    
    const valueRange = extent(data, value);
    const yearRange = extent(data, year);
    const radius = 28;
    const maxAngle = 270;

    const yRange = getYRange(size);
    const xRange = getXRange(size);

    const circleTotalSize = min([yRange[1] - yRange[0], xRange[1] - xRange[0]]);
    const circleRadius = circleTotalSize / 2;
    const circleCenter = [xRange[0] + ((xRange[1] - xRange[0]) / 2), yRange[0] + ((yRange[1] - yRange[0]) / 2)];
    
    // Scales
    const angleScale = scaleLinear([0, valueRange[1]], [0, maxAngle]);

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

    const lineSelection = container.selectAll('path.mark')
                                   .data(data)
                                   .join(
                                        enter => enter.append('path').classed('mark', true)
                                   );

    lineSelection.attr('d', (d, i) => {
                        const outerRadius = circleRadius - (i * radius);
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
                 .attr('fill', 'red')
                 .attr('stroke-width', 2);
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