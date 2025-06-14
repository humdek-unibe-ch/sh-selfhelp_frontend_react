'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Box, 
    Text, 
    Paper, 
    Group, 
    ActionIcon,
    Alert,
    Checkbox
} from '@mantine/core';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { IconGripVertical, IconInfoCircle } from '@tabler/icons-react';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { debug } from '../../../../utils/debug-logger';
import styles from './DragDropMenuPositioner.module.css';

export interface IMenuPageItem {
    id: string;
    keyword: string;
    label: string;
    position: number;
    isNew?: boolean;
}

interface IDragDropMenuPositionerProps {
    // Menu configuration
    menuType: 'header' | 'footer';
    title: string;
    
    // Current page being positioned
    currentPage?: IAdminPage | null;
    newPageKeyword?: string;
    
    // Menu state
    enabled: boolean;
    position: number | null;
    
    // Callbacks
    onEnabledChange: (enabled: boolean) => void;
    onPositionChange: (position: number | null) => void;
    onGetFinalPosition?: (getFinalPositionFn: () => number | null) => void;
    
    // Context for filtering pages (for child page creation)
    parentPage?: IAdminPage | null;
    
    // Optional styling
    showCheckbox?: boolean;
    checkboxLabel?: string;
    showAlert?: boolean;
    alertMessage?: string;
}

// DragClonePortal: render children in a portal to <body>
const DragClonePortal = ({ children }: { children: React.ReactNode }) => {
    if (typeof window === "undefined") return null;
    return createPortal(children, document.body);
};

export function DragDropMenuPositioner({
    menuType,
    title,
    currentPage,
    newPageKeyword,
    enabled,
    position,
    onEnabledChange,
    onPositionChange,
    onGetFinalPosition,
    parentPage = null,
    showCheckbox = true,
    checkboxLabel,
    showAlert = true,
    alertMessage = "Drag the page to set its position"
}: IDragDropMenuPositionerProps) {
    const [menuPages, setMenuPages] = useState<IMenuPageItem[]>([]);
    const [droppedIndex, setDroppedIndex] = useState<number | null>(null);
    
    // Fetch admin pages
    const { pages, isLoading: pagesLoading } = useAdminPages();

    // Process admin pages into menu items based on context
    const processMenuPages = useMemo(() => {
        if (!pages.length) return [];

        const menuPages: IMenuPageItem[] = [];
        
        // Determine which pages to show based on context
        let pagesToProcess: IAdminPage[] = [];

        if (parentPage) {
            // Creating a child page - show only children of the parent
            pagesToProcess = parentPage.children || [];
            debug('Processing child pages for parent', 'DragDropMenuPositioner', {
                parentKeyword: parentPage.keyword,
                childrenCount: pagesToProcess.length,
                menuType
            });
        } else {
            // Show root pages (pages with parent: null)
            pagesToProcess = pages.filter(page => page.parent === null);
            debug('Processing root pages', 'DragDropMenuPositioner', {
                rootPagesCount: pagesToProcess.length,
                menuType
            });
        }

        const processPage = (page: IAdminPage) => {
            const positionField = menuType === 'header' ? 'nav_position' : 'footer_position';
            const pagePosition = page[positionField];
            
            // Only include pages that have a position in this menu type
            if (pagePosition !== null && pagePosition !== undefined) {
                menuPages.push({
                    id: page.id_pages.toString(),
                    keyword: page.keyword,
                    label: page.keyword,
                    position: pagePosition
                });
            }
        };

        // Process pages
        pagesToProcess.forEach(processPage);

        // Sort pages by position
        menuPages.sort((a, b) => a.position - b.position);

        debug('Processed menu pages', 'DragDropMenuPositioner', {
            context: parentPage ? 'child' : 'root',
            parentKeyword: parentPage?.keyword,
            menuType,
            pagesCount: menuPages.length
        });

        return menuPages;
    }, [pages, parentPage, menuType]);

    // Initialize menu pages when data is available
    useEffect(() => {
        setMenuPages(processMenuPages);
    }, [processMenuPages]);

    // Add new page to menu list when enabled
    const menuPagesWithNew = useMemo(() => {
        const pageKeyword = newPageKeyword || currentPage?.keyword;
        if (!pageKeyword || !enabled) {
            return menuPages;
        }
        
        // Check if the page already exists in the menu
        const existingPageIndex = menuPages.findIndex(page => page.keyword === pageKeyword);
        
        if (existingPageIndex !== -1) {
            // Page already exists in menu - mark it as current instead of adding duplicate
            let updatedPages = menuPages.map((page, index) => ({
                ...page,
                isNew: index === existingPageIndex // Mark the existing page as current
            }));
            
            // If user has dragged to a new position, reorder the pages
            if (droppedIndex !== null && droppedIndex !== existingPageIndex) {
                // Remove the current page from its original position
                const currentPageItem = updatedPages[existingPageIndex];
                updatedPages = updatedPages.filter((_, index) => index !== existingPageIndex);
                
                // Insert at the new position (no adjustment needed since we removed the item first)
                updatedPages.splice(droppedIndex, 0, currentPageItem);
                
                debug('Reordering existing page in menu', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    originalIndex: existingPageIndex,
                    newIndex: droppedIndex,
                    droppedIndex,
                    updatedPagesCount: updatedPages.length
                });
            }
            
            debug('Page already exists in menu, marking as current', 'DragDropMenuPositioner', {
                menuType,
                pageKeyword,
                existingPageIndex,
                droppedIndex,
                menuPagesCount: menuPages.length
            });
            
            return updatedPages;
        } else {
            // Page doesn't exist in menu - add as new (for create mode)
            const newPage: IMenuPageItem = {
                id: currentPage ? `current-page-${currentPage.id_pages}` : 'new-page',
                keyword: pageKeyword,
                label: pageKeyword,
                position: menuPages.length > 0 ? menuPages[menuPages.length - 1].position + 10 : 10,
                isNew: true
            };

            // If we have a dropped index, insert at that position
            if (droppedIndex !== null && droppedIndex >= 0) {
                const result = [...menuPages];
                result.splice(droppedIndex, 0, newPage);
                
                debug('Adding new page at dropped index', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    droppedIndex,
                    menuPagesCount: menuPages.length
                });
                
                return result;
            }

            // Default: add at the end
            debug('Adding new page at end', 'DragDropMenuPositioner', {
                menuType,
                pageKeyword,
                menuPagesCount: menuPages.length
            });
            
            return [...menuPages, newPage];
        }
    }, [menuPages, currentPage, newPageKeyword, enabled, droppedIndex]);

    // Reset dropped index when menu is disabled and set position to null
    useEffect(() => {
        if (!enabled) {
            if (droppedIndex !== null) {
                setDroppedIndex(null);
            }
            // Only set position to null if it's not already null to prevent infinite loops
            if (position !== null) {
                debug('Setting position to null because menu is disabled', 'DragDropMenuPositioner', {
                    menuType,
                    previousPosition: position
                });
                onPositionChange(null);
            }
        }
    }, [enabled, droppedIndex, position]); // Removed onPositionChange from dependencies to prevent infinite loops

    // Handle drag end with improved positioning
    const handleDragEnd = (result: DropResult) => {
        const pageKeyword = newPageKeyword || currentPage?.keyword;
        if (!result.destination || !pageKeyword) {
            debug('Drag cancelled or invalid', 'DragDropMenuPositioner', { 
                hasDestination: !!result.destination,
                pageKeyword 
            });
            return;
        }
        
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        
        // Only update if the position actually changed
        if (sourceIndex !== destinationIndex) {
            debug('Drag completed with position change', 'DragDropMenuPositioner', {
                menuType,
                sourceIndex,
                destinationIndex,
                pageKeyword
            });
            
            // Store the dropped index for position calculation (visual index only)
            setDroppedIndex(destinationIndex);
            // Store the visual index in the form, actual position will be calculated on submit
            onPositionChange(destinationIndex);
        } else {
            debug('Drag completed but no position change', 'DragDropMenuPositioner', {
                menuType,
                sourceIndex,
                destinationIndex,
                pageKeyword
            });
        }
    };

    // Calculate final position based on index and existing pages
    const calculateFinalPosition = (pages: IMenuPageItem[], targetIndex: number): number => {
        // If no existing pages, start at position 10
        if (pages.length === 0) {
            return 10;
        }
        
        if (targetIndex === 0) {
            // First position - place before the first existing page
            const firstPagePosition = pages[0].position;
            return Math.max(1, firstPagePosition - 10);
        } else if (targetIndex >= pages.length) {
            // Last position - place after the last existing page
            const lastPagePosition = pages[pages.length - 1].position;
            return lastPagePosition + 10;
        } else {
            // Between two pages - calculate middle position with proper spacing
            const prevPage = pages[targetIndex - 1];
            const nextPage = pages[targetIndex];
            const gap = nextPage.position - prevPage.position;
            
            // If there's enough gap, place in the middle
            if (gap > 2) {
                return Math.floor((prevPage.position + nextPage.position) / 2);
            } else {
                // Not enough gap - shift all subsequent pages by 10 and place in between
                return prevPage.position + 5;
            }
        }
    };

    // Get final calculated position for external use
    const getFinalPosition = (): number | null => {
        if (!enabled) return null;
        
        const pageKeyword = newPageKeyword || currentPage?.keyword;
        if (!pageKeyword) return null;
        
        // Check if the page already exists in the menu
        const existingPageIndex = menuPages.findIndex(page => page.keyword === pageKeyword);
        
        if (existingPageIndex !== -1) {
            // Page already exists in menu
            if (droppedIndex !== null && droppedIndex !== existingPageIndex) {
                // User dragged to a new position - calculate based on the final reordered position
                // Create a copy of the menu pages and simulate the reordering
                const reorderedPages = [...menuPages];
                const currentPageItem = reorderedPages[existingPageIndex];
                
                // Remove the current page from its original position
                reorderedPages.splice(existingPageIndex, 1);
                
                // Insert at the new position (no adjustment needed since we removed the item first)
                reorderedPages.splice(droppedIndex, 0, currentPageItem);
                
                // Calculate position based on the new index in the reordered array
                const finalPosition = calculateFinalPosition(reorderedPages.filter(p => p.keyword !== pageKeyword), droppedIndex);
                
                debug('Calculating final position for existing page (dragged)', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    existingPageIndex,
                    droppedIndex,
                    finalPosition,
                    reorderedPagesCount: reorderedPages.length,
                    otherPagesCount: reorderedPages.filter(p => p.keyword !== pageKeyword).length
                });
                return finalPosition;
            } else {
                // User didn't drag or dragged to same position - keep existing position
                const existingPosition = menuPages[existingPageIndex].position;
                debug('Keeping existing position for page in menu', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    existingPageIndex,
                    existingPosition
                });
                return existingPosition;
            }
        } else {
            // Page doesn't exist in menu - this is create mode
            if (droppedIndex !== null) {
                // User dragged to specific position - calculate based on the dropped index
                const finalPosition = calculateFinalPosition(menuPages, droppedIndex);
                debug('Calculating final position for new page (dragged)', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    droppedIndex,
                    menuPagesCount: menuPages.length,
                    finalPosition
                });
                return finalPosition;
            } else {
                // User enabled menu but didn't drag - add at the end
                const endPosition = menuPages.length > 0 ? menuPages[menuPages.length - 1].position + 10 : 10;
                debug('Calculating final position for new page (no drag)', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    menuPagesCount: menuPages.length,
                    endPosition
                });
                return endPosition;
            }
        }
    };

    // Expose getFinalPosition function to parent component
    useEffect(() => {
        if (onGetFinalPosition) {
            onGetFinalPosition(getFinalPosition);
        }
    }, [onGetFinalPosition, enabled, position, menuPages]);

    // Render menu item for drag and drop
    const renderMenuItem = (item: IMenuPageItem, index: number) => {
        return (
            <Draggable 
                key={item.id} 
                draggableId={item.id} 
                index={index}
                isDragDisabled={!item.isNew} // Only new/current pages can be dragged
            >
                {(provided, snapshot) => {
                    const draggableContent = (
                        <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...(item.isNew ? provided.dragHandleProps : {})}
                            p="xs"
                            mb="xs"
                            withBorder
                            className={`${styles.item} ${item.isNew ? styles.newPageItem : ''} ${snapshot.isDragging ? styles.itemDragging : ''}`}
                            style={{
                                ...provided.draggableProps.style,
                            }}
                        >
                            <Group gap="xs" wrap="nowrap">
                                <ActionIcon
                                    variant="subtle"
                                    size="sm"
                                    className={item.isNew ? styles.dragItem : styles.dragItemDisabled}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <IconGripVertical size="0.8rem" />
                                </ActionIcon>
                                <Text size="sm" fw={item.isNew ? 600 : 400} style={{ flex: 1 }}>
                                    {item.label}
                                </Text>
                                {item.isNew && (
                                    <Text size="xs" c="blue" fw={500}>
                                        {currentPage ? 'Current' : 'New'}
                                    </Text>
                                )}
                            </Group>
                        </Paper>
                    );

                    // If dragging, render in portal to escape modal/container transform
                    if (snapshot.isDragging) {
                        return <DragClonePortal>{draggableContent}</DragClonePortal>;
                    }
                    
                    return draggableContent;
                }}
            </Draggable>
        );
    };

    return (
        <Box className={styles.dragContainer}>
            {showCheckbox && (
                <Checkbox
                    label={checkboxLabel || `${title} Menu`}
                    checked={enabled}
                    onChange={(event) => onEnabledChange(event.currentTarget.checked)}
                    mb="md"
                />
            )}
            
            {enabled && (
                <>
                    <Text size="sm" fw={500} mb="xs">{title}</Text>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId={`${menuType}-menu`}>
                            {(provided, snapshot) => (
                                <Box
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    p="sm"
                                    className={styles.dragArea}
                                >
                                    {menuPagesWithNew?.map((item, index) => renderMenuItem(item, index))}
                                    {provided.placeholder}
                                    {(menuPagesWithNew?.length ?? 0) === 0 && (
                                        <Text size="sm" c="dimmed" ta="center" mt="md">
                                            No pages to display
                                        </Text>
                                    )}
                                </Box>
                            )}
                        </Droppable>
                    </DragDropContext>
                    
                    {showAlert && (
                        <Alert icon={<IconInfoCircle size="1rem" />} mt="xs" color="blue">
                            {alertMessage}
                        </Alert>
                    )}
                </>
            )}
        </Box>
    );
}

// Export as default
export { DragDropMenuPositioner as default }; 