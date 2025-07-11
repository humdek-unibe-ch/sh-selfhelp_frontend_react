import React from 'react';
import { Button } from '@mantine/core';
import { IButtonStyle } from '../../../types/common/styles.types';
import { getFieldContent } from '../../../utils/style-field-extractor';

/**
 * Props interface for ButtonStyle component
 * @interface IButtonStyleProps
 * @property {IButtonStyle} style - The button style configuration object
 */
interface IButtonStyleProps {
    style: IButtonStyle;
}

/**
 * ButtonStyle component renders a button element with optional styling and actions.
 * Supports different button types and URL navigation.
 *
 * @component
 * @param {IButtonStyleProps} props - Component props
 * @returns {JSX.Element} Rendered button with specified styling and action
 */
const ButtonStyle: React.FC<IButtonStyleProps> = ({ style }) => {
    const label = getFieldContent(style, 'label');
    const url = getFieldContent(style, 'url');
    const type = getFieldContent(style, 'type') || 'primary';
    const cssClass = getFieldContent(style, 'css');

    const handleClick = () => {
        if (url) {
            window.location.href = url;
        }
    };

    return (
        <Button 
            variant="filled"
            color={type}
            onClick={handleClick}
            className={cssClass}
        >
            {label}
        </Button>
    );
};

export default ButtonStyle;