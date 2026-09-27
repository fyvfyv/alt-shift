import type { Meta, StoryObj } from '@storybook/react-vite';
import typography from '../../styles/typography.module.css';
import { Icon, type IconName, type IconSize } from './Icon';

// A record rather than a list: typecheck fails until an icon added to Icon.tsx is listed here.
const catalog = {
  'copy-03': true,
  'home-02': true,
  'loading-02': true,
  plus: true,
  'repeat-03': true,
  'trash-01': true,
} satisfies Record<IconName, true>;
const names = Object.keys(catalog) as IconName[];
const sizes: IconSize[] = [24, 20];

const meta = {
  component: Icon,
  args: { name: 'plus', size: 24 },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Icons take the color of the text next to them.
export const Catalog: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${sizes.length}, 24px)`,
        gap: 16,
        alignItems: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      {names.map((name) => (
        <div key={name} style={{ display: 'contents' }}>
          <span className={typography.sm}>{name}</span>
          {sizes.map((size) => (
            <Icon key={size} name={name} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
};
