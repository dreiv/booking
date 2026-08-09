import type { Meta, StoryObj } from '@storybook/vue3-vite';

const meta: Meta = {
  title: 'Sandbox/TailwindCheck',
  parameters: { layout: 'centered' },
};

export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="p-8 rounded-2xl bg-slate-800 border border-slate-600 space-y-4">
        <h1 class="text-3xl font-bold text-white">Tailwind is working</h1>
        <p class="text-slate-300">If this box is dark with rounded corners and this text is legible, the Vite plugin is compiling utilities correctly through Storybook.</p>
        <button class="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors">
          Hover me
        </button>
      </div>
    `,
  }),
};
