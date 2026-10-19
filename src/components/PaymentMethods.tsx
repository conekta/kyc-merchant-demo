import { Badge, Group, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { TbBuildingBank, TbCheck, TbChevronRight, TbCreditCard } from 'react-icons/tb';

import type { IconType } from 'react-icons';

export type Method = 'card' | 'direct_debit';

const OPTIONS: { id: Method; icon: IconType; name: string; description: string; badge?: string }[] = [
  { id: 'card', icon: TbCreditCard, name: 'Tarjeta de crédito o débito', description: 'Visa, Mastercard, Amex' },
  {
    id: 'direct_debit',
    icon: TbBuildingBank,
    name: 'Domiciliación bancaria',
    description: 'Cargo automático a tu cuenta, sin tarjeta ni fecha de vencimiento',
    badge: 'Para pagos mensuales',
  },
];

export const PaymentMethods = ({ method, onChange }: { method: Method; onChange: (m: Method) => void }) => (
  <Stack gap='sm'>
    {OPTIONS.map(({ id, icon: Icon, name, description, badge }) => {
      const selected = id === method;
      return (
        <UnstyledButton key={id} w='100%' onClick={() => onChange(id)} aria-pressed={selected}>
          <Group
            gap='sm'
            wrap='nowrap'
            p='sm'
            style={{
              borderRadius: 10,
              border: `1.5px solid var(--mantine-color-${selected ? 'primary-6' : 'neutral-2'})`,
              background: selected ? 'var(--mantine-color-primary-0)' : '#fff',
            }}
          >
            <ThemeIcon variant='light' color={selected ? 'primary.6' : 'neutral.6'} size={34} radius='md'>
              <Icon size={18} />
            </ThemeIcon>
            <Stack gap={0} style={{ flex: 1 }}>
              <Group gap='sm'>
                <Text size='sm' fw={600}>
                  {name}
                </Text>
                {badge && <Badge color='primary.6'>{badge}</Badge>}
              </Group>
              <Text size='xs' c='neutral.5'>
                {description}
              </Text>
            </Stack>
            {selected ? (
              <ThemeIcon size={20} radius='xl' color='primary.6'>
                <TbCheck size={12} />
              </ThemeIcon>
            ) : (
              <TbChevronRight size={16} color='var(--mantine-color-neutral-4)' />
            )}
          </Group>
        </UnstyledButton>
      );
    })}
  </Stack>
);
