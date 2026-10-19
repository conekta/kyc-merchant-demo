import { ActionIcon, Collapse, Divider, Group, Stack, Text, ThemeIcon, Title, UnstyledButton } from '@mantine/core';
import {
  TbCalendar,
  TbChevronDown,
  TbCircleX,
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
  TbLock,
  TbRepeat,
} from 'react-icons/tb';

import type { IconType } from 'react-icons';

const ROWS: { icon: IconType; label: string; value: string }[] = [
  { icon: TbCalendar, label: 'Primer cargo', value: '5 de noviembre' },
  { icon: TbRepeat, label: 'Siguientes', value: 'el día 5 de cada mes' },
  { icon: TbCircleX, label: 'Cancelación', value: 'Cuando quieras' },
];

const AMOUNT = '$1,249.00 MXN';

interface Props {
  opened: boolean;
  onToggle: () => void;
  mobile: boolean;
}

const Logo = () => (
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
      flexShrink: 0,
    }}
  >
    P
  </div>
);

const Details = () => (
  <>
    <Stack gap={0}>
      <Text size='xs' c='neutral.5'>
        Pago mensual
      </Text>
      <Title order={2}>{AMOUNT}</Title>
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
  </>
);

const SecureNote = (props: { mt?: string }) => (
  <Group gap='xs' {...props}>
    <TbLock size={12} color='var(--mantine-color-neutral-5)' />
    <Text size='xs' c='neutral.5'>
      Pago seguro con Conekta
    </Text>
  </Group>
);

// En mobile el resumen va arriba del checkout como cabecera plegable; en desktop es una barra lateral
// que se reduce a un riel con el logo.
export const OrderSummary = ({ opened, onToggle, mobile }: Props) => {
  if (mobile) {
    return (
      <Stack gap={0} bg='neutral.1' style={{ borderBottom: '1px solid var(--mantine-color-neutral-2)' }}>
        <UnstyledButton onClick={onToggle} aria-expanded={opened} p='md'>
          <Group gap='sm' wrap='nowrap'>
            <Logo />
            <Text fw={700} style={{ flex: 1, minWidth: 0 }} truncate>
              Protecta Seguros
            </Text>
            {!opened && (
              <Text size='sm' fw={600}>
                {AMOUNT}
              </Text>
            )}
            <TbChevronDown
              size={16}
              color='var(--mantine-color-neutral-5)'
              style={{ transform: opened ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
            />
          </Group>
        </UnstyledButton>
        <Collapse in={opened}>
          <Stack gap='md' px='md' pb='md'>
            <Details />
            <SecureNote />
          </Stack>
        </Collapse>
      </Stack>
    );
  }

  if (!opened) {
    return (
      <Stack
        gap='md'
        align='center'
        w={56}
        py='xl'
        bg='neutral.1'
        style={{ borderRight: '1px solid var(--mantine-color-neutral-2)', flexShrink: 0 }}
      >
        <Logo />
        <ActionIcon variant='subtle' color='neutral.6' onClick={onToggle} aria-label='Mostrar resumen'>
          <TbLayoutSidebarLeftExpand size={18} />
        </ActionIcon>
      </Stack>
    );
  }

  return (
    <Stack
      gap='md'
      w={320}
      p='xl'
      bg='neutral.1'
      style={{ borderRight: '1px solid var(--mantine-color-neutral-2)', flexShrink: 0 }}
    >
      <Group gap='sm' wrap='nowrap'>
        <Logo />
        <Text fw={700} style={{ flex: 1 }}>
          Protecta Seguros
        </Text>
        <ActionIcon variant='subtle' color='neutral.6' onClick={onToggle} aria-label='Ocultar resumen'>
          <TbLayoutSidebarLeftCollapse size={18} />
        </ActionIcon>
      </Group>
      <Details />
      <SecureNote mt='auto' />
    </Stack>
  );
};
