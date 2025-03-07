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
    startRadius,
    endRadius,
    angles = []
}) => {
    let d = [
        `M ${x}, ${y}`, // Move to center of ring
        `m 0, -${startRadius}`, // Move to top of ring
        `a ${startRadius}, ${startRadius}, 0, 1, 0, 1, 0`, // Draw outer arc, but don't close it
        `Z`, // default fill-rule:even-odd will help create the empty innards
        //`m 1 ${endRadius - startRadius}`, // Move to top point of inner radius
        //`a ${startRadius}, ${startRadius}, 0, 1, 1, -1, 0`, // Close the inner ring. Actually will still work without, but inner ring will have one unit missing in strok
    ];

    let spacing = [0, 120];

    let nextPosition = polarToCartesian(x, y, endRadius, spacing[0]);
    d.push('M', nextPosition.x, nextPosition.y);
    d.push('L', x, y);
    
    nextPosition = polarToCartesian(x, y, endRadius, spacing[1]);
    d.push('L', nextPosition.x, nextPosition.y);

    nextPosition = polarToCartesian(x, y, endRadius, spacing[0]);
    d.push("A", endRadius, endRadius, 0, 1, 1, nextPosition.x, nextPosition.y);

    /*
    angles.forEach(({start, end}) => {
        const startPosition = polarToCartesian(x, y, startRadius, start);
        const endPosition = polarToCartesian(x, y, startRadius, end);
       // d.push('L', x, y);
        d.push('M', startPosition.x, startPosition.y);

        //d.push("A", endRadius, endRadius, 0, 0, 0, endPosition.x, endPosition.y);
        d.push('L', x, y);
        d.push('L', endPosition.x, endPosition.y);
        //d.push('L', endPosition.x, endPosition.y);
        //d.push("A", startRadius, startRadius, 0, largeArcFlag, 1, endPosition.x, endPosition.y);
    });
    */

    d.push('Z');

    return d.join(' ');       
}
  

  export { describeArc };