const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
	const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

	return {
		x: centerX + (radius * Math.cos(angleInRadians)),
		y: centerY + (radius * Math.sin(angleInRadians))
	};
}

const describeArc = ({
	x,
	y,
	outerRadius,
	innerRadius,
	angle
}) => {
	/*
	Arc command for reference:
		A rx ry rotation large-arc-flag sweep-flag x y

		rx, ry: The first two parameters are the imaginary circle’s horizontal and vertical radius. 
				If we draw a circle, those two values are the same.

		rotation: overall rotation in degress of the circle
		large-arc-flag: should it go the long way to draw the arc of the short way
		sweep-flag: reverses the arc to draw the other way
		x, y: the end point of the arc
	*/

	const outerStartPoint = polarToCartesian(x, y, outerRadius, 0);
	const outerEndPoint = polarToCartesian(x, y, outerRadius, angle);

	const innerStartPoint = polarToCartesian(x, y, innerRadius, 0);
	const innerEndPoint = polarToCartesian(x, y, innerRadius, angle);

	const largeArcFlag = angle > 180 ? 1 : 0;

	let d = [
		 // Move to start point
		`M ${outerStartPoint.x}, ${outerStartPoint.y}`,
		// Draw the outer arc
		`A ${outerRadius}, ${outerRadius}, 0, ${largeArcFlag}, 1, ${outerEndPoint.x}, ${outerEndPoint.y}`,
		// Move to the inner arc end point
		`L ${innerEndPoint.x} ${innerEndPoint.y}`,
		// Draw the inner arc
		`A ${innerRadius}, ${innerRadius}, 0, ${largeArcFlag}, 0, ${innerStartPoint.x}, ${innerStartPoint.y}`,
		`Z`
	];

	return d.join(' ');
}

export { describeArc };