import { Group, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { TbBuildingBank } from 'react-icons/tb';

export const CollapsedBar = ({ onChange }: { onChange: () => void }) => (
  <Group gap='sm' wrap='nowrap' p='sm' style={{ border: '1px solid var(--mantine-color-neutral-2)', borderRadius: 10 }}>
    <ThemeIcon variant='light' color='primary.6' size={28} radius='md'>
      <TbBuildingBank size={16} />
    </ThemeIcon>
    <Text size='sm' fw={600} style={{ flex: 1 }}>
      Domiciliación bancaria
    </Text>
    <UnstyledButton onClick={onChange}>
      <Text size='xs' c='primary.6' fw={600}>
        Cambiar método
      </Text>
    </UnstyledButton>
  </Group>
);
