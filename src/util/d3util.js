import {
    formatLocale
} from 'd3';

const ensureElement = ({
    parent,
    elementType,
    className
}) => {
    let element = parent.selectAll(`${elementType}.${className}`)
                          .data([0])
                          .join(enter => enter.append(elementType).classed(className, true));
    return element;
}

const layoutContainersVertically = ({
    selection,
    spacing
}) => {
    const nodes = selection.nodes();
    const bbBoxes = nodes.map(d => d.getBBox());

    let currentY = 0;
    let currentBBox;

    selection.attr('transform', (_, i) => {
        currentBBox = bbBoxes[i];
        
        const newY = currentY;
        currentY = currentY + currentBBox.y + currentBBox.height + spacing;

        return `translate(${0}, ${newY})`;
    });
}

const layoutContainersVerticallyWithAggregation = ({
    selection,
    spacing,
    shouldAggregate,
    isAggregatedNode
}) => {
    const nodes = selection.nodes();
    const bbBoxes = nodes.map(d => d.getBBox());

    let currentY = 0;
    let currentBBox;

    let totalAggregationCount = 0;
    let aggregate;
    let aggregatedNode;
    let currentSpacing;
    let startAggregatedPosition = {x: 0, y: 0};

    selection.attr('transform', (d, i) => {
        aggregate = shouldAggregate(d, i);
        aggregatedNode = isAggregatedNode(d, i);

        currentBBox = bbBoxes[i];

        // Add an extra spacing for the first node to be aggreated
        if (aggregate && totalAggregationCount === 0) {
            currentSpacing = spacing * 2;
        } else {
            currentSpacing = spacing;
        }

        let newX = 0;
        let newY = currentY;

        if (aggregatedNode) {
            // First find the first bbox and last bbox, we assume the aggregated node is the last
            //      in the list or else this might not work
            newX = startAggregatedPosition.x;
            
            // Move the Y the the middle of the first aggregation node and currentY
            newY = startAggregatedPosition.y + (currentBBox.height / 2) + ((currentY - startAggregatedPosition.y) / 2) - currentBBox.height - currentSpacing;
            
        } else {
            currentY = currentY + currentBBox.y + currentBBox.height + currentSpacing;
        }

        // Make sure we save the position for the first aggregator
        if (aggregate && totalAggregationCount === 0) {
            startAggregatedPosition.x = currentBBox.x + currentBBox.width;
            startAggregatedPosition.y = currentY;
        }

        if (aggregate) {
            totalAggregationCount++;
        }

        return `translate(${newX}, ${newY})`;
    });
}

export { ensureElement, layoutContainersVertically, layoutContainersVerticallyWithAggregation };