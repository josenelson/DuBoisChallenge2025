import React, { useRef, useEffect, useState } from 'react';
import { 
    scaleLinear, 
    scaleBand, 
    extent, 
    select, 
    scaleQuantile, 
    geoPath, 
    geoIdentity 
} from 'd3';
import { getSource03, getShape03, getCountyData03 } from '../util/data';
import Background from '../components/Background';

const margins = {
    top: 20,
    bottom: 20, 
    left: 20,
    right: 20
}

const titleText = "Acres of \nland \nowned by \nBlack \nGeorgians \n1970-1900";

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
    const value = d => d.acresOwnedPercentage;
    const ratiosRange = extent(countyData, value);
    const yRange = getYRange(size);
    const xRange = getXRange(size);
    const visualizationSize = [xRange[1] - xRange[0], yRange[1] - yRange[0]];
    const colorScale = scaleQuantile(ratiosRange, ['#7e6583', '#4682b4', '#00aa00', '#dc143c', '#ffc0cb', '#ffd700', '#d2b48c', '#654321', '#000000']);

    // State
    let selectedIndex = -1;

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

    container.attr('transform', `translate(${xRange[0]}, ${yRange[0]})`);

    let geoSelectionPathsForeground = container.selectAll('path.mark-foreground').data(geometries);
    const geoSelectionPathsBackground = container.selectAll('path.mark-background').data(geometries);
    const geoSelectionLabels = container.selectAll('text.mark').data(geometries);
    const scaleLegend = container.selectAll('text.mark').data(geometries);

    // Paths for map
    // background
    geoSelectionPathsBackground.enter()
                               .append('path')
                               .classed('mark-background', true)
                               .merge(geoSelectionPathsBackground)
                               .attr('d', path)
                               .attr('filter', 'url(#filter-g9odhc_gqf-2)');

    // Foreground

    const styleSelection = (selection) => {
        selection.attr('fill-opacity', (_, i) => i === selectedIndex ? 1 : 0.65)
                 .attr('stroke-width', (_, i) => i === selectedIndex ? 2 : 1)
                 .attr('stroke-opacity',  (_, i) => i === selectedIndex ? 1 : 0.2);
    };

    geoSelectionPathsForeground = geoSelectionPathsForeground.enter()
                                                             .append('path')
                                                             .classed('mark-foreground', true)
                                                             .merge(geoSelectionPathsForeground);

    geoSelectionPathsForeground.attr('d', path)
                               .attr('fill', (_, i) => {
                                    return colorScale(countyData[i].acresOwnedPercentage);
                               })
                               .attr('stroke', 'black')
                               .attr('data-index', (_, i) => i)
                               .on('mouseover', (e) => {
                                    const selection = select(e.currentTarget);
                                    const index = selection.attr('data-index') * 1;
                                    selectedIndex = index;
                                    geoSelectionPathsForeground.call(styleSelection);
                               })
                               .on('mouseout', () => {
                                    selectedIndex = -1;
                                    geoSelectionPathsForeground.call(styleSelection);
                               })
                               .call(styleSelection, false);

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
                      .attr('font-family', 'Charter')
                      .attr('font-weight', 'bold')
                      .attr('fill-opacity', 0.9)
                      .attr('font-size', 11)
                      .attr('data-index', (_, i) => i)
                      .text((d, i) => {
                            return data[i].acres;
                      })
                      .on('mouseover', (e) => {
                            const selection = select(e.currentTarget);
                            const index = selection.attr('data-index') * 1;
                            selectedIndex = index;
                            geoSelectionPathsForeground.call(styleSelection);
                       })
                       .on('mouseout', () => {
                            selectedIndex = -1;
                            geoSelectionPathsForeground.call(styleSelection);
                       });

    // Legend

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