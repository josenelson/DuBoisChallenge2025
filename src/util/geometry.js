const polarToCartesian = ({
	centerX,
	centerY,
	radius,
	angleInDegrees
}) => {
	const angleInRadians = angleInDegrees * Math.PI / 180.0;

	return {
		x: centerX + (radius * Math.cos(angleInRadians)),
		y: centerY + (radius * Math.sin(angleInRadians))
	};
}

const describeArcPoint = ({
	x,
	y,
	radius,
	endAngle = 0,
	startAngle = 0,
}) => {
	const midAngle = startAngle + ((endAngle - startAngle) / 2);

	const point = polarToCartesian({ centerX: x, centerY: y, radius: radius, angleInDegrees: midAngle });

	return point;
}

const describeArc = ({
	x,
	y,
	outerRadius,
	innerRadius,
	endAngle = 0,
	startAngle = 0,
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

	const outerStartPoint = polarToCartesian({ centerX: x, centerY: y, radius: outerRadius, angleInDegrees: startAngle });
	const outerEndPoint = polarToCartesian({ centerX: x, centerY: y, radius: outerRadius, angleInDegrees: endAngle });

	const innerStartPoint = polarToCartesian({ centerX: x, centerY: y, radius: innerRadius, angleInDegrees: startAngle });
	const innerEndPoint = polarToCartesian({ centerX: x, centerY: y, radius: innerRadius, angleInDegrees: endAngle });

	const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

	const d = [
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
	width,
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
				nextX = x + maxLength - gap;

				// Add the horizontal line
				points.push({x: nextX, y: previousPoint.y, direction: currentDirection, curve: false, isReverse: false});

				// Add the vertical line
				points.push({x: nextX, y: previousPoint.y + gap + (2 * width), direction: currentDirection, curve: true, isReverse: false});
			} else {
				// Issue: when wrapping back around the curve is going past the origin point x because of the 
				//		radius, this is ok for now but need to revisit this in the future
				//		need to bring it back by 1 radius?
				nextX = x + width - gap;

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

const findLargestBox = arr => {
	let x1 = 0;
	let y1 = 0;
	let x2 = 0;
	let y2 = 0;

	arr.forEach(({x, y , width, height}, index) => {
		if (index === 0) {
			x1 = x;
			y1 = y;
			x2 = x + width;
			y2 = y + height;
		} else {
			if (x < x1) x1 = x;
			if (y < y1) y1 = y;
			if (x + width > x2) x2 = x + width;
			if (y + height > y2) y2 = y + height;
		}
	});

	return {
		x: x1,
		y: y1, 
		width: x2 - x1,
		height: y2 - y1
	};
}

const connectorPath = ({
	fromNodeSelection
}) => {
	const fromNodes = fromNodeSelection.nodes().map(d => d.getBoundingClientRect());

	const fromBBox = findLargestBox(fromNodes);

	const gap = 10;

	let startX = fromBBox.x + fromBBox.width - gap;
	let startY = fromBBox.y - gap;
	let midY = fromBBox.y + (fromBBox.height / 2);
	let endY = fromBBox.y + fromBBox.height + gap;

	const points = [
		// First elbow
		`M ${startX} ${startY}`,
		`L ${startX + gap * 2} ${startY}`,

		// Move down to the arrow
		`L ${startX + gap * 2} ${midY - gap}`,

		// Start the arrow
		`l ${gap} ${gap}`,

		// Close the arrow
		`l ${-gap} ${gap}`,

		// Continue moving down
		`L ${startX + gap * 2} ${endY}`,

		// Second elbow
		`L ${startX} ${endY}`
	];

	return points.join('' );
}

/*
	Positions the elements in the grid with the bullet aligned to either left 
	or right
*/
const legend2ColumnLayout = ({
	itemCount,
	startX, 
	startY,
	endX, 
	endY,
	bulletSize = 10,
	verticalPadding = 10,
	horizontalSpacing = 10
}) => {

	// First calculate how many items we can fit on the right side
	const verticalSpace = endY - startY - (verticalPadding * 2);

	// Calculate how many items we can fit per column
	const rightColumnItemCount = Math.ceil(itemCount / 2);
	const leftColumnItemCount = itemCount - rightColumnItemCount;

	// Calculate the spacing between each item in each column
	const rightColumnFreeSpacing = verticalSpace - (rightColumnItemCount * bulletSize);
	const rightColumnItemSpacing = rightColumnFreeSpacing >= 10 ? rightColumnFreeSpacing / (rightColumnItemCount + 1) : 10;

	const leftColumnFreeSpacing = verticalSpace - (leftColumnItemCount * bulletSize);
	const leftColumnItemSpacing = leftColumnFreeSpacing >= 10 ? leftColumnFreeSpacing / (leftColumnItemCount + 1) : 10;

	// 1 for right column, -1 for left column
	const findColumn = itemIndex => itemIndex < rightColumnItemCount ? 1 : -1;

	const findRowYPosition = itemIndex => {
		const column = findColumn(itemIndex);
		const rowIndex = column === 1 ? itemIndex : itemIndex - rightColumnItemCount;
		const spacing = column === 1 ? rightColumnItemSpacing : leftColumnItemSpacing;

		return startY + verticalPadding + (rowIndex + 1) * (bulletSize + spacing);
	}
	
	// Return the position of bullet and text for the given item index
	return (itemIndex) => {
		const column = findColumn(itemIndex);
		const yPosition = findRowYPosition(itemIndex);
		let bulletPosition;
		let textPosition;
		let alignment; // 1 for right, -1 for left

		if (column == 1) {
			// Right column, bullet is on the right and text is on the left of the bullet
			bulletPosition = { x: endX, y: yPosition };

			textPosition = { x: endX - bulletSize - horizontalSpacing, y: yPosition };
			alignment = 1;

		} else {
			// Left column
			bulletPosition = { x: startX, y: yPosition };
			textPosition = { x: startX + bulletSize + horizontalSpacing, y: yPosition };
			alignment = -1;
		}

		return {
			bullet: bulletPosition,
			text: textPosition,
			alignment: alignment
		}
	}
};

export { 
	describeArc, 
	polarToCartesian, 
	snakePath, 
	connectorPath, 
	describeArcPoint,
	legend2ColumnLayout
};