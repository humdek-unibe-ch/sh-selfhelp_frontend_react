"use client";

import { Button, TextInput, Stack, Group, Radio, Checkbox, Select, Text, Box, Badge, Transition, Paper } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState, useMemo } from 'react';
import { IconGripVertical } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import classes from './CreatePagePanel.module.css';

interface CreatePagePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PageFormValues {
  keyword: string;
  pageType: string;
  headerPosition: boolean;
  headlessPage: boolean;
  pageAccessType: string;
  protocols: string[];
  openAccess: boolean;
  advanced: boolean;
  urlPattern: string;
  position: number | null;
}

// Mock data for existing pages
const mockPages = [
  { id: '1', content: 'Page 1', position: 10 },
  { id: '2', content: 'Page 2', position: 20 },
  { id: '3', content: 'Page 3', position: 30 },
];

export const CreatePagePanel = ({ isOpen, onClose }: CreatePagePanelProps) => {
  const [pages, setPages] = useState(mockPages);
  const [newPagePosition, setNewPagePosition] = useState<number | null>(null);

  const form = useForm<PageFormValues>({
    initialValues: {
      keyword: '',
      pageType: 'sections',
      headerPosition: false,
      headlessPage: false,
      pageAccessType: 'mobile_and_web',
      protocols: ['GET'],
      openAccess: false,
      advanced: false,
      urlPattern: '',
      position: null,
    },
  });

  // Combine existing pages with new page if keyword exists
  const allPages = useMemo(() => {
    if (!form.values.keyword) return pages;
    
    const newPage = {
      id: 'new-page',
      content: form.values.keyword,
      position: newPagePosition ?? (pages.length + 1) * 10,
      isNew: true
    };

    if (newPagePosition === null) {
      return [...pages, newPage];
    }

    const sortedPages = [...pages, newPage].sort((a, b) => a.position - b.position);
    return sortedPages;
  }, [pages, form.values.keyword, newPagePosition]);

  const handleDragEnd = (result: { source: { index: number }; destination?: { index: number } }) => {
    if (!result.destination) return;

    const reorderedPages = [...allPages];
    const [removed] = reorderedPages.splice(result.source.index, 1);
    reorderedPages.splice(result.destination.index, 0, removed);

    const updatedPages = reorderedPages.map((page, index) => ({
      ...page,
      position: (index + 1) * 10,
    }));

    const newPageIndex = updatedPages.findIndex(page => 'isNew' in page);
    if (newPageIndex !== -1) {
      setNewPagePosition(updatedPages[newPageIndex].position);
    }

    setPages(updatedPages.filter(page => !('isNew' in page)));
  };

  const getDragHandleProps = (defaultDragHandleProps: any) => ({
    ...defaultDragHandleProps,
    style: {
      ...defaultDragHandleProps?.style,
      cursor: 'grab'
    }
  });

  const handleSubmit = (values: PageFormValues) => {
    console.log('Form values:', values);
    onClose();
    form.reset();
  };

  return (
    <Transition mounted={isOpen} transition="slide-right" duration={200}>
      {(styles) => (
        <Paper
          shadow="md"
          style={{
            ...styles,
            position: 'fixed',
            top: 0,
            left: '300px', // Position next to navbar
            bottom: 0,
            width: '400px',
            height: '100vh',
            overflowY: 'auto',
            zIndex: 1000,
            borderLeft: '1px solid var(--mantine-color-gray-3)',
          }}
        >
          <Box p="md">
            <Group justify="space-between" mb="lg">
              <Text size="lg" fw={500}>Create New Page</Text>
              <Button variant="subtle" onClick={onClose}>Close</Button>
            </Group>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* Page Properties */}
                <TextInput
                  label="Keyword"
                  placeholder="Enter unique page identifier"
                  required
                  {...form.getInputProps('keyword')}
                />
                <Text size="xs" c="dimmed">
                  The page keyword must be unique. Note that the page keyword can contain numbers, letters, - and _ characters
                </Text>

                {/* Page Type */}
                <Radio.Group
                  name="pageType"
                  label="Page Type"
                  description="The page type specified how the page content will be assembled"
                  required
                  {...form.getInputProps('pageType')}
                >
                  <Group mt="xs">
                    <Radio value="sections" label="Sections" />
                    <Radio value="navigation" label="Navigation" />
                    <Radio 
                      value="component" 
                      label="Component" 
                      disabled={!form.values.advanced}
                    />
                    <Radio 
                      value="backend" 
                      label="Backend" 
                      disabled={!form.values.advanced}
                    />
                    <Radio 
                      value="ajax" 
                      label="Ajax" 
                      disabled={!form.values.advanced}
                    />
                  </Group>
                </Radio.Group>

                {/* Header Configuration */}
                <Group grow>
                  <Checkbox
                    label="Header Position"
                    description="When activated, the page will appear in the header"
                    {...form.getInputProps('headerPosition', { type: 'checkbox' })}
                  />
                  <Box display={form.values.advanced ? 'block' : 'none'}>
                    <Checkbox
                      label="Headless Page"
                      description="A headless page will not render any header or footer"
                      {...form.getInputProps('headlessPage', { type: 'checkbox' })}
                    />
                  </Box>
                </Group>

                {/* Position Settings */}
                {form.values.headerPosition && (
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Page Order</Text>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="pages">
                        {(provided) => (
                          <Stack gap="xs" {...provided.droppableProps} ref={provided.innerRef}>
                            {allPages.map((page, index) => (
                              <Draggable 
                                key={page.id} 
                                draggableId={page.id} 
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <Group 
                                    p="xs"
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={classes.draggableItem}
                                    data-is-dragging={snapshot.isDragging}
                                    style={{
                                      ...provided.draggableProps.style,
                                      background: 'var(--mantine-color-body)',
                                      border: '1px solid var(--mantine-color-gray-3)',
                                      borderRadius: 'var(--mantine-radius-sm)',
                                      transform: snapshot.isDragging
                                        ? `${provided.draggableProps.style?.transform} translateX(-85%)`
                                        : provided.draggableProps.style?.transform
                                    }}
                                  >
                                    <Box 
                                      {...getDragHandleProps(provided.dragHandleProps)}
                                      className={classes.dragHandle}
                                    >
                                      <IconGripVertical />
                                    </Box>
                                    <Badge size="sm">{page.position / 10}</Badge>
                                    <Text size="sm">{page.content}</Text>
                                    {'isNew' in page && <Badge size="sm" color="blue">New</Badge>}
                                  </Group>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </Stack>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </Box>
                )}

                {/* Access Control */}
                <Select
                  label="Page Access Type"
                  data={[
                    { value: 'mobile', label: 'Mobile' },
                    { value: 'web', label: 'Web' },
                    { value: 'mobile_and_web', label: 'Mobile and web' },
                  ]}
                  {...form.getInputProps('pageAccessType')}
                />

                {/* Advanced Settings Toggle */}
                <Checkbox
                  label="Advanced"
                  {...form.getInputProps('advanced', { type: 'checkbox' })}
                />

                {/* Protocols - Only visible in advanced mode */}
                {form.values.advanced && (
                  <Checkbox.Group
                    label="Protocol"
                    description="The protocol specifies how a page is accessed"
                    {...form.getInputProps('protocols')}
                  >
                    <Group mt="xs">
                      <Checkbox value="GET" label="GET" />
                      <Checkbox value="POST" label="POST" />
                      <Checkbox value="PUT" label="PUT" />
                      <Checkbox value="PATCH" label="PATCH" />
                      <Checkbox value="DELETE" label="DELETE" />
                    </Group>
                  </Checkbox.Group>
                )}

                {/* URL Pattern - Read-only unless in advanced mode */}
                <TextInput
                  label="URL Pattern"
                  description="This is set automatically. If you know what you are doing you may overwrite the value"
                  placeholder="/page-url-pattern"
                  readOnly={!form.values.advanced}
                  {...form.getInputProps('urlPattern')}
                />

                {/* Form Actions */}
                <Group justify="flex-end" mt="md">
                  <Button variant="light" onClick={onClose}>Cancel</Button>
                  <Button type="submit">Create</Button>
                </Group>
              </Stack>
            </form>
          </Box>
        </Paper>
      )}
    </Transition>
  );
};