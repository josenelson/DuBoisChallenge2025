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

const dollarValueFormatter = formatLocale({
    thousands: ","
  });

export { ensureElement, dollarValueFormatter };