const polarToCartesian = ({
	centerX,
	centerY,
	radius,
	angleInDegrees
}) => {
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

	const outerStartPoint = polarToCartesian({ centerX: x, centerY: y, radius: outerRadius, angleInDegrees: 0 });
	const outerEndPoint = polarToCartesian({ centerX: x, centerY: y, radius: outerRadius, angleInDegrees: angle });

	const innerStartPoint = polarToCartesian({ centerX: x, centerY: y, radius: innerRadius, angleInDegrees: 0 });
	const innerEndPoint = polarToCartesian({ centerX: x, centerY: y, radius: innerRadius, angleInDegrees: angle });

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

const snakePath = ({
	x,
	y,
	width = 10,
	length,
	maxLength,
	gap
}) => {
	let currentDirection = 1; // 1 for left to right, -1 for right to left
	const points = [];

	// Start the first point
	points.push({x: x, y : y, direction: currentDirection, curve: false, isReverse: false})

	const loops = maxLength < length ? Math.ceil(length / maxLength) : 1;
	const reminder = maxLength < length ? length % maxLength : length;

	for(let loop = 1; loop <= loops; loop ++) {
		const isEnd = loop == loops;
		const previousPoint = points[points.length - 1];
		let nextX;
		
		if (isEnd) {
			let adjustedReminder = reminder == 0 ? maxLength : reminder;

			if (currentDirection == 1) {
				nextX = previousPoint.x + adjustedReminder;
				// Add the horizontal line
				points.push({x: nextX, y: previousPoint.y, direction: currentDirection, curve: false, isReverse: false});

				// Add the vertical line
				points.push({x: nextX, y: previousPoint.y + width, direction: currentDirection, curve: false, isReverse: false});
			} else {
				nextX = previousPoint.x - adjustedReminder;
				
				// Add the horizontal line
				points.push({x: nextX, y: previousPoint.y, direction: currentDirection, curve: false, isReverse: false});

				// Add the vertical line
				points.push({x: nextX, y: previousPoint.y - width, direction: currentDirection, curve: false, isReverse: false});
			}
		} else {
			if (currentDirection == 1) {
				nextX = x + maxLength;

				// Add the horizontal line
				points.push({x: nextX, y: previousPoint.y, direction: currentDirection, curve: false, isReverse: false});

				// Add the vertical line
				points.push({x: nextX, y: previousPoint.y + gap + (2 * width), direction: currentDirection, curve: true, isReverse: false});
			} else {
				nextX = x + width;

				// Add the horizontal line
				points.push({x: nextX, y: previousPoint.y, direction: currentDirection, curve: false, isReverse: false});

				// Add the vertical line
				points.push({x: nextX, y: previousPoint.y + gap, direction: currentDirection, curve: true, isReverse: false});
			}
		}

		currentDirection = currentDirection * (-1);
	}

	for(let loop = loops; loop >=1; loop--) {
		const isEnd = loop == 1;
		const previousPoint = points[points.length - 1];
		let nextX;
		
		if (isEnd) {
			nextX = x;
			// Add the horizontal line, but don't add the vertical line since we will close it with the Z command
			points.push({x: nextX, y: previousPoint.y, direction: currentDirection, curve: false, isReverse: true});
		} else {
			if (currentDirection == 1) { // direction: ---->
				nextX = x + maxLength - width;

				// Add the horizontal line
				points.push({x: nextX, y: previousPoint.y, direction: currentDirection, curve: false, isReverse: true});

				// Add the vertical line
				points.push({x: nextX, y: previousPoint.y - gap, direction: currentDirection, curve: true, isReverse: true});
			} else { // direction: <-------
				nextX = x;

				// Add the horizontal line
				points.push({x: nextX, y: previousPoint.y, direction: currentDirection, curve: false, isReverse: true});

				// Add the vertical line
				points.push({x: nextX, y: previousPoint.y - gap - (width * 2), direction: currentDirection, curve: true, isReverse: true});
			}
		}

		currentDirection = currentDirection * (-1);
	}

	const d = points.map(({
		x, 
		y, 
		direction, 
		curve, 
		isReverse
	}, index, points) => {
		if (index === 0) {
			// First point just move to the position
			return `M ${x} ${y}`;
		} else if (curve && !isReverse) {
			const radius = direction === 1 ? (gap + (2 * width)) / 2 : gap / 2;
			const sweepFlag = direction === 1 ? 1 : 0;
			return `A ${radius}, ${radius}, 0, 0, ${sweepFlag}, ${x}, ${y}`;
		} else if (curve && isReverse) {
			const radius = direction === 0 ? (gap + (2 * width)) / 2 : gap / 2;
			const sweepFlag = direction === 1 ? 0 : 1;
			return `A ${radius}, ${radius}, 0, 0, ${sweepFlag}, ${x}, ${y}`;
		} else {
			return `L ${x} ${y}`;
		}
	});

	// Close the path
	d.push('Z');

	return d.join(' ');
}

export { describeArc, polarToCartesian, snakePath };