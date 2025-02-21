import React, { useRef, useEffect, useState } from 'react';
import { 
    scaleLinear, 
    scaleBand, 
    extent, 
    select, 
    easeCubic, 
    format, 
    json, 
    geoAlbersUsa, 
    geoPath, 
    geoIdentity 
} from 'd3';
import { getSource03, getShape03, getCountyData03 } from '../util/data';
import Background from '../components/Background';
import { radians } from '../util/math';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "WIP \nVisualization"; //"Acres of \nland \nowned by \nBlack \nGeorgians";

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
    data,
    geoData,
    countyData
}) => {
    if (data.length == 0) return;
    if (!geoData) return;
    if (!countyData) return;

    // Data ranges
    const valueRange = extent(data, d => d.value);
    const yRange = getYRange(size);
    const xRange = getXRange(size);
    
    const startX = xRange[0];
    const startY = yRange[0];
    const maxWidth = xRange[1] - xRange[0];
    const maxHeight = yRange[1] - yRange[0];
    const visualizationSize = [maxWidth, maxHeight];
    const midX = (xRange[1] - xRange[0]) / 2;
    const midY = (yRange[1] - yRange[0]) / 2;

    const isoTransform = ({
        x = startX, 
        y = startY, 
        midX = midX,
        midY = midY, 
        angle = 30,
        scale = 1
    }) => `translate(${x} ${y}) rotate(${angle} ${midX} ${midY}) skewX(-${angle}) `;
    
    // Geometries
    const projection = geoIdentity().reflectY(true).fitSize(visualizationSize, geoData);
    const path = geoPath().projection(projection);

    const { geometries } = geoData;

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
    
    let isoMetricContainer = container.selectAll('g.isometric-container')
                                      .data([data])
                                      .join(
                                        enter => {
                                            const selection = enter.append('g')
                                                                   .classed('isometric-container', true);
                                            return selection;
                                        }
                                       );                                 
        
    isoMetricContainer.attr('transform', isoTransform({
        x: startX,
        y: startY, 
        midX: midX,
        midY: midY,
        angle: 30
    }));

    const geoSelectionPaths = isoMetricContainer.selectAll('path.mark').data(geometries);
    const geoSelectionLabels = isoMetricContainer.selectAll('text.mark').data(geometries);

    /* Test layout */
    (() => {
        const ratio = maxWidth / maxHeight;
        const newWidth = (angle) => {
            return maxWidth - (maxHeight * Math.sin(radians(angle)));
        }
        const newHeight = (angle) => {
            return maxHeight - (maxWidth * Math.sin(radians(angle)));
        }

        const layoutSelection = container.selectAll('rect.layout').data([0,10, 30, 90]).join(
            enter => {
                const result = enter.append('rect')
                                    .attr('stroke-width', 1) 
                                    .attr('stroke-opacity', d => (100 - d) / 100)
                                    .attr('stroke', 'black')
                                    .attr('fill', 'none')
                                    .attr('data-angle', d => d)
                                    .classed('layout', true);
                
                return result;
            }
        );
    
        layoutSelection.attr('x', 0)
                       .attr('y', 0)
                       .attr('width', maxWidth)
                       .attr('height', maxHeight)
                       .attr('transform', angle => {
                            const isoMatrix = new DOMMatrixReadOnly()
                                .translate(startX, startY)
                                .rotate(angle)
                                .skewX(-angle);

                            const edge1 = isoMatrix.transformPoint(new DOMPoint(startX, startY + maxHeight, 0, 0));
                            const edge2 = isoMatrix.transformPoint(new DOMPoint(startX + maxWidth, startY + maxHeight, 0, 0));

                            const invertedMatrix = isoMatrix.inverse();
                            const newWidth = isoMatrix.transformPoint(new DOMPoint(maxWidth, maxHeight, 0, 0));

                            return isoMatrix.toString();
                        });
    

                       // 0 -> 1 , 45 -> 0.5
        /* END: Test layout */
    })();
    

    // Paths for map
    return; //test, not to be bothered for now
    geoSelectionPaths.enter()
                     .append('path')
                     .classed('mark', true)
                     .merge(geoSelectionPaths)
                     .attr('d', path)
                     .attr('fill', '#DC143C')
                     .attr('fill-opacity', '0.9')
                     .attr('stroke-width', '1')
                     .attr('stroke', 'black');

    // Labels for map
    geoSelectionLabels.enter()
                      .append('text')
                      .classed('mark', true)
                      .merge(geoSelectionLabels)
                      .attr('x', d => {
                            return path.centroid(d)[0];
                      })
                      .attr('y', d => {
                            return path.centroid(d)[1];
                      })
                      .attr('text-anchor', 'middle')
                      .attr('alignment-baseline', 'middle')
                      .text((d, i) => {
                            return data[i].acres;
                      })
                      .attr('opacity', 0);
};

const Chart = ({
    size
}) => {
    const containerRef = useRef(null);
    const [data, setData] = useState([]);
    const [geoData, setGeoData] = useState(null);
    const [countyData, setCountyData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const [
                dataResult,
                geoDataResult,
                countyDataResult
            ] = await Promise.all([getSource03(), getShape03(), getCountyData03()]);
    
            setData(dataResult);
            setGeoData(geoDataResult);
            setCountyData(countyDataResult);
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
            geoData: geoData,
            countyData: countyData,
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
                {/*<Background />*/}
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