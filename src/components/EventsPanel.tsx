import { Accordion, Code, Group, Stack, Text } from '@mantine/core';

export interface KycEvent {
  time: string;
  name: string;
  payload: unknown;
}

export const EventsPanel = ({ events }: { events: KycEvent[] }) => (
  <Accordion variant='contained' radius='md'>
    <Accordion.Item value='events'>
      <Accordion.Control>Eventos del iframe ({events.length})</Accordion.Control>
      <Accordion.Panel>
        <Stack gap='xs'>
          {events.length === 0 && (
            <Text size='xs' c='neutral.5'>
              Sin eventos todavía.
            </Text>
          )}
          {events.map((e, i) => (
            <Group key={i} gap='sm' wrap='nowrap' align='flex-start'>
              <Text size='xs' c='neutral.5' ff='monospace'>
                {e.time}
              </Text>
              <Text size='xs' fw={600}>
                {e.name}
              </Text>
              <Code block style={{ flex: 1 }}>
                {JSON.stringify(e.payload ?? {})}
              </Code>
            </Group>
          ))}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion>
);
