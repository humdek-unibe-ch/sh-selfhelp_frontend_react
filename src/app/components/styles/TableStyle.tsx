import React from 'react';
import type { ITableStyle } from '../../../types/common/styles.types';
import { Box, Table } from '@mantine/core';
import BasicStyle from './BasicStyle';

interface ITableStyleProps {
    style: ITableStyle;
}

const TableStyle: React.FC<ITableStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Box className={style.css}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Tbody>
                    {children.map((childStyle, index) => (
                        childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
                    ))}
                </Table.Tbody>
            </Table>
        </Box>
    );
};

export default TableStyle; 