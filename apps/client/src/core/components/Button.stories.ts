import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from './Button.vue';
import type { ButtonVariant } from './Button.types';

interface ButtonArgs {
  variant: ButtonVariant;
  disabled: boolean;
}

const meta: Meta<ButtonArgs> = {
  title: 'Core/Button',
  component: Button,
  args: {
    variant: 'primary',
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<ButtonArgs>;

export const Playground: Story = {
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: `<Button v-bind="args">Continue</Button>`,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap items-center gap-4 p-6">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </div>
    `,
  }),
};
