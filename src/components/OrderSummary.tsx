import { Divider, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { TbCalendar, TbCircleX, TbLock, TbRepeat } from 'react-icons/tb';

import type { IconType } from 'react-icons';

const ROWS: { icon: IconType; label: string; value: string }[] = [
  { icon: TbCalendar, label: 'Primer cargo', value: '5 de noviembre' },
  { icon: TbRepeat, label: 'Siguientes', value: 'el día 5 de cada mes' },
  { icon: TbCircleX, label: 'Cancelación', value: 'Cuando quieras' },
];

export const OrderSummary = () => (
  <Stack
    gap='md'
    w={320}
    p='xl'
    bg='neutral.1'
    style={{ borderRight: '1px solid var(--mantine-color-neutral-2)', flexShrink: 0 }}
  >
    <Group gap='sm' wrap='nowrap'>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: '#0E7C7B',
          color: '#fff',
          fontWeight: 800,
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        P
      </div>
      <Text fw={700}>Protecta Seguros</Text>
    </Group>
    <Stack gap={0}>
      <Text size='xs' c='neutral.5'>
        Pago mensual
      </Text>
      <Title order={2}>$1,249.00 MXN</Title>
      <Text size='sm' c='neutral.6'>
        Seguro de auto · Plan Amplio
      </Text>
    </Stack>
    <Divider />
    {ROWS.map(({ icon: Icon, label, value }) => (
      <Group key={label} gap='sm' wrap='nowrap'>
        <ThemeIcon variant='light' color='neutral.6' size={28} radius='md'>
          <Icon size={16} />
        </ThemeIcon>
        <Stack gap={0}>
          <Text size='xs' c='neutral.5'>
            {label}
          </Text>
          <Text size='sm' fw={600}>
            {value}
          </Text>
        </Stack>
      </Group>
    ))}
    <Group gap='xs' mt='auto'>
      <TbLock size={12} color='var(--mantine-color-neutral-5)' />
      <Text size='xs' c='neutral.5'>
        Pago seguro con Conekta
      </Text>
    </Group>
  </Stack>
);
