import React from 'react';
import { Box } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { IDivStyle } from '../../../types/common/styles.types';
import { getFieldContent } from '../../../utils/style-field-extractor';

/**
 * Props interface for DivStyle component
 * @interface IDivStyleProps
 * @property {IDivStyle} style - The div style configuration object
 */
interface IDivStyleProps {
    style: IDivStyle;
}

/**
 * DivStyle component renders a div container with optional styling and child elements.
 * Supports custom background, border, and text colors.
 * Uses Mantine Box component for flexibility.
 *
 * @component
 * @param {IDivStyleProps} props - Component props
 * @returns {JSX.Element} Rendered div with styled children
 */
const DivStyle: React.FC<IDivStyleProps> = ({ style }) => {
    const backgroundColor = getFieldContent(style, 'color_background');
    const borderColor = getFieldContent(style, 'color_border');
    const textColor = getFieldContent(style, 'color_text');
    const cssClass = getFieldContent(style, 'css');

    // Build inline styles for colors
    const inlineStyles: React.CSSProperties = {};
    if (backgroundColor) {
        inlineStyles.backgroundColor = backgroundColor;
    }
    if (borderColor) {
        inlineStyles.borderColor = borderColor;
        inlineStyles.borderWidth = '1px';
        inlineStyles.borderStyle = 'solid';
    }
    if (textColor) {
        inlineStyles.color = textColor;
    }

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Box 
            className={cssClass}
            style={inlineStyles}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
            ))}
        </Box>
    );
};

export default DivStyle;