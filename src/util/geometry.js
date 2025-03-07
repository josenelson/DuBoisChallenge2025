const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
  
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
  
const describeArc = ({
    x, 
    y, 
    radius,
    angles = []
}) => {
    let d = [];

    angles.forEach(({start, end}) => {
        const startPosition = polarToCartesian(x, y, radius, start);
        const endPosition = polarToCartesian(x, y, radius, end);
        const largeArcFlag = end - start <= 180 ? 0 : 1;

        d.push('M', startPosition.x, startPosition.y);
        d.push("A", radius, radius, 0, largeArcFlag, 1, endPosition.x, endPosition.y);
        d.push('L', x, y);
    });

    d.push('Z');

    return d.join(' ');       
}
  

  export { describeArc };