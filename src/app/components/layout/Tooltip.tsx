/* eslint-disable jsdoc/require-param */
/* eslint-disable jsdoc/require-returns */
import React, { useRef } from "react";
import "./Tooltip.scss";

interface TooltipProps {
    tooltipContent: string | React.ReactNode;
    children: React.ReactNode;
}

/**
 * Component to display a tooltip on hover.
 */
const Tooltip: React.FC<TooltipProps> = ({ children, tooltipContent }) => {
    const tooltip = useRef<HTMLDivElement>(null);

    const onEnter = () => {
        if (tooltip?.current) {
            tooltip.current.style.visibility = "visible";
            tooltip.current.style.opacity = "1";
        }
    };

    const onLeave = () => {
        if (tooltip?.current) {
            tooltip.current.style.visibility = "hidden";
            tooltip.current.style.opacity = "0";
        }
    };

    return (
        <div className="tooltip">
            <div className="tooltip__wrapper" ref={tooltip}>
                <div className="tooltip__arrow" />
                {tooltipContent}
            </div>
            <div className="tooltip__children" onMouseEnter={onEnter} onMouseLeave={onLeave}>
                {children}
            </div>
        </div>
    );
};

export default Tooltip;
