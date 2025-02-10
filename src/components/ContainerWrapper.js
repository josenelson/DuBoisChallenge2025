import React, { useState, useEffect, useRef, cloneElement } from 'react';

const withContainer = (element) => {
    const containerRef = useRef(null);
    const [size, setSize] = useState({width: 0, height: 0});
    
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setSize({width: width, height: height});
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => { resizeObserver.disconnect(); }
    }, []);

    return (
        <div ref={containerRef} className='container'>
            {Array.isArray(element) ? 
                element.map(child => cloneElement(child, {size: size})):
                cloneElement(element, {size: size})
            }
        </div>
    );
}

export default withContainer;