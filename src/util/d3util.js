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

export { ensureElement, layoutContainersVertically };