import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, type ButtonSize, type ButtonVariant } from './Button';

const meta = {
  component: Button,
  args: { children: 'Generate Now' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

const variants: ButtonVariant[] = ['primary', 'secondary', 'tertiary'];
const sizes: ButtonSize[] = ['xl', 'md'];

export const Matrix: Story = {
  render: ({ children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 16 }}>
      {variants.flatMap((variant) =>
        sizes.map((size) => (
          <div key={`${variant}-${size}`} style={{ display: 'contents' }}>
            <Button variant={variant} size={size}>
              {children}
            </Button>
            <Button variant={variant} size={size} iconLeading="plus">
              {children}
            </Button>
            <Button variant={variant} size={size} loading>
              {children}
            </Button>
            <Button variant={variant} size={size} disabled>
              {children}
            </Button>
          </div>
        )),
      )}
    </div>
  ),
};

export const Loading: Story = { args: { loading: true, children: 'Generating…' } };

export const Disabled: Story = { args: { disabled: true } };

export const WithIcons: Story = {
  args: { variant: 'secondary', iconLeading: 'repeat-03', children: 'Try Again' },
};

export const TertiaryWithIcon: Story = {
  args: { variant: 'tertiary', iconTrailing: 'copy-03', children: 'Copy to clipboard' },
};

export const AsLink: Story = {
  args: { to: '/new', size: 'md', iconLeading: 'plus', children: 'Create New' },
};
