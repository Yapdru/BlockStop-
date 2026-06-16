import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card, CardBody } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';

const meta = {
  title: 'Components/Animations',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Animation demonstrations and transitions for interactive components.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Fade animation
export const FadeAnimation: Story = {
  render: () => {
    const [isVisible, setIsVisible] = React.useState(true);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsVisible(!isVisible)}>
          Toggle Fade
        </Button>
        <div
          className={`transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Card variant="elevated" padding="lg">
            <CardBody padding="lg">
              <p className="text-neutral-700">
                This element fades in and out smoothly.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  },
};

// Slide animation
export const SlideAnimation: Story = {
  render: () => {
    const [isSlided, setIsSlided] = React.useState(false);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsSlided(!isSlided)}>
          Toggle Slide
        </Button>
        <div
          className={`transition-transform duration-500 transform ${
            isSlided ? 'translate-x-20' : 'translate-x-0'
          }`}
        >
          <Card variant="elevated" padding="lg" className="max-w-sm">
            <CardBody padding="lg">
              <p className="text-neutral-700">
                This element slides smoothly.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  },
};

// Scale animation
export const ScaleAnimation: Story = {
  render: () => {
    const [isScaled, setIsScaled] = React.useState(false);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsScaled(!isScaled)}>
          Toggle Scale
        </Button>
        <div
          className={`transition-transform duration-500 transform origin-center ${
            isScaled ? 'scale-125' : 'scale-100'
          }`}
        >
          <Card variant="elevated" padding="lg" className="max-w-sm">
            <CardBody padding="lg">
              <p className="text-neutral-700">
                This element scales smoothly.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  },
};

// Spin animation
export const SpinAnimation: Story = {
  render: () => {
    const [isSpin, setIsSpin] = React.useState(false);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsSpin(!isSpin)}>
          Toggle Spin
        </Button>
        <div className="flex justify-center">
          <div
            className={`transition-transform duration-500 ${
              isSpin ? 'animate-spin' : ''
            }`}
          >
            <div className="w-16 h-16 bg-blue-600 rounded-lg" />
          </div>
        </div>
      </div>
    );
  },
};

// Bounce animation
export const BounceAnimation: Story = {
  render: () => (
    <div className="flex justify-center">
      <div className="animate-bounce">
        <div className="w-16 h-16 bg-purple-600 rounded-full" />
      </div>
    </div>
  ),
};

// Pulse animation
export const PulseAnimation: Story = {
  render: () => (
    <div className="flex justify-center">
      <div className="animate-pulse">
        <Card variant="elevated" padding="lg" className="max-w-sm">
          <CardBody padding="lg">
            <div className="space-y-3">
              <div className="h-4 bg-neutral-300 rounded w-3/4" />
              <div className="h-4 bg-neutral-300 rounded w-1/2" />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  ),
};

// Color transition
export const ColorTransition: Story = {
  render: () => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <div
        className={`transition-colors duration-300 p-8 rounded-lg ${
          isHovered ? 'bg-blue-600' : 'bg-neutral-200'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <p className={`text-center font-semibold ${
          isHovered ? 'text-white' : 'text-neutral-700'
        }`}>
          Hover to change color
        </p>
      </div>
    );
  },
};

// Multiple transitions
export const MultipleTransitions: Story = {
  render: () => {
    const [isActive, setIsActive] = React.useState(false);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsActive(!isActive)}>
          Toggle Animation
        </Button>
        <div
          className={`transition-all duration-500 ${
            isActive
              ? 'opacity-100 translate-x-0 scale-100'
              : 'opacity-50 translate-x-4 scale-95'
          }`}
        >
          <Card variant="elevated" padding="lg" className="max-w-sm">
            <CardBody padding="lg">
              <p className="text-neutral-700">
                Multiple properties animate together.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  },
};

// Staggered list
export const StaggeredList: Story = {
  render: () => {
    const [isVisible, setIsVisible] = React.useState(true);
    const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsVisible(!isVisible)}>
          Toggle List
        </Button>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={item}
              className={`transition-all duration-500 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: isVisible ? `${idx * 100}ms` : '0ms',
              }}
            >
              <Card variant="flat" padding="md">
                <CardBody padding="md">
                  <p className="text-neutral-700">{item}</p>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// Loading skeleton
export const LoadingSkeleton: Story = {
  render: () => {
    const [isLoading, setIsLoading] = React.useState(true);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsLoading(!isLoading)}>
          Toggle Loading
        </Button>
        {isLoading ? (
          <Card variant="elevated" padding="lg">
            <CardBody padding="lg">
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-neutral-300 rounded w-1/2" />
                <div className="h-4 bg-neutral-300 rounded w-full" />
                <div className="h-4 bg-neutral-300 rounded w-5/6" />
                <div className="flex gap-2 pt-4">
                  <div className="h-10 bg-neutral-300 rounded flex-1" />
                  <div className="h-10 bg-neutral-300 rounded flex-1" />
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card variant="elevated" padding="lg">
            <CardBody padding="lg">
              <h3 className="text-lg font-bold mb-2">Content Loaded</h3>
              <p className="text-neutral-600 mb-4">
                The skeleton has been replaced with actual content.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary">Confirm</Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    );
  },
};

// Hover effects
export const HoverEffects: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-2xl">
      <div className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <Card variant="elevated" padding="lg">
          <CardBody padding="lg" className="text-center">
            <p className="font-semibold">Shadow</p>
          </CardBody>
        </Card>
      </div>
      <div className="hover:scale-105 transition-transform duration-200 cursor-pointer">
        <Card variant="elevated" padding="lg">
          <CardBody padding="lg" className="text-center">
            <p className="font-semibold">Scale</p>
          </CardBody>
        </Card>
      </div>
      <div className="hover:translate-y-1 transition-transform duration-200 cursor-pointer">
        <Card variant="elevated" padding="lg">
          <CardBody padding="lg" className="text-center">
            <p className="font-semibold">Lift</p>
          </CardBody>
        </Card>
      </div>
    </div>
  ),
};

// Modal entrance animation
export const ModalAnimation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(!isOpen)}>
          Open Modal
        </Button>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 opacity-100"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="transition-all duration-300 transform scale-100 opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <Card variant="elevated" padding="lg" className="max-w-md">
                <CardBody padding="lg">
                  <h3 className="text-lg font-bold mb-2">Animated Modal</h3>
                  <p className="text-neutral-600 mb-4">
                    This modal enters with a smooth animation.
                  </p>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => setIsOpen(false)}
                  >
                    Close
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </>
    );
  },
};

// Wave animation
export const WaveAnimation: Story = {
  render: () => (
    <div className="flex justify-center items-center gap-2 p-8">
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className="w-4 h-16 bg-blue-600 rounded animate-pulse"
          style={{
            animationDelay: `${idx * 0.1}s`,
          }}
        />
      ))}
    </div>
  ),
};

// Accessibility note
export const ReducedMotion: Story = {
  render: () => (
    <Card variant="elevated" padding="lg">
      <CardBody padding="lg">
        <p className="text-neutral-700 mb-4">
          Animations respect <code className="bg-neutral-100 px-2 py-1">prefers-reduced-motion</code> preference.
        </p>
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
        <div className="animate-bounce">
          <p>This animation respects motion preferences</p>
        </div>
      </CardBody>
    </Card>
  ),
};
